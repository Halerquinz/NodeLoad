import { injected, token } from "brandi";
import { Logger } from "winston";
import {
    DOWNLOAD_TASK_DATA_ACCESSOR_TOKEN,
    DownloadStatus,
    DownloadTask,
    DownloadTaskDataAccessor,
    DownloadType
} from "../../dataaccess/db";
import { FILE_CLIENT_TOKEN, FileClient } from "../../dataaccess/file";
import { DOWNLOAD_TASK_CREATED_PRODUCER_TOKEN, DownloadTaskCreatedProducer } from "../../dataaccess/mq";
import { LOGGER_TOKEN, METADATA_CONVERTER_TOKEN, MetadataConverter } from "../../utils";
import { Downloader, HTTPDownloader } from "./downloader";
import fs from "fs";

const DOWNLOAD_TASK_METADATA_FIELD_NAME_FILE_NAME = "file-name";

export interface DownloadTaskManagementOperator {
    createDownloadTask(userId: number, downloadType: DownloadType, url: string): Promise<DownloadTask>;
    executeDownloadTask(downloadTaskId: number): Promise<void>;
}

export class DownloadTaskManagementOperatorImpl implements DownloadTaskManagementOperator {
    constructor(
        private readonly fileClient: FileClient,
        private readonly downloadDM: DownloadTaskDataAccessor,
        private readonly downloadTaskCreatedProducer: DownloadTaskCreatedProducer,
        private readonly metadataConverter: MetadataConverter,
        private readonly logger: Logger,
    ) { }

    public async createDownloadTask(userId: number, downloadType: DownloadType, url: string): Promise<DownloadTask> {
        return this.downloadDM.withTransaction(async (downloadDM) => {
            const metadata = JSON.stringify({
                data: new Map<string, any>()
            });
            const downloadTaskId = await downloadDM.createDownloadTask({
                ofUserId: userId,
                url: url,
                downloadType: downloadType,
                downloadStatus: DownloadStatus.DOWNLOAD_STATUS_PENDING,
                metadata: metadata
            });

            await this.downloadTaskCreatedProducer.createDownloadTaskCreatedMessage({ id: downloadTaskId });

            return new DownloadTask(
                downloadTaskId,
                userId,
                downloadType,
                DownloadStatus.DOWNLOAD_STATUS_PENDING,
                url,
                metadata
            );
        });
    }

    public async executeDownloadTask(downloadTaskId: number): Promise<void> {
        const downloadTask = await this.updateDownloadTaskStatusFromPendingToDownloading(downloadTaskId);

        let downloader: Downloader;
        switch (downloadTask.downloadType) {
            case DownloadType.DOWNLOAD_TYPE_HTTP:
                downloader = new HTTPDownloader(downloadTask.url, this.logger);
                break;
            default:
                this.logger.error(`${downloadTask.downloadType} unsupported download type`);
                await this.updateDownloadTaskStatusToFailed(downloadTask);
                throw new Error("unsupported download type");
        }

        const fileName = `download_file_${downloadTaskId}`;
        const fileWriteCloser = this.fileClient.write(fileName);
        if (fileWriteCloser === null) {
            await this.updateDownloadTaskStatusToFailed(downloadTask);
            this.logger.error("failed to get download file writer");
            throw new Error("failed to get download file writer");
        }

        const metadata = await downloader.download(fileWriteCloser);
        if (metadata === null) {
            await this.updateDownloadTaskStatusToFailed(downloadTask);
            this.logger.error("failed to download");
            throw new Error("failed to download");
        }

        metadata.set(DOWNLOAD_TASK_METADATA_FIELD_NAME_FILE_NAME, fileName);
        downloadTask.downloadStatus = DownloadStatus.DOWNLOAD_STATUS_SUCCESS;
        downloadTask.metadata = JSON.stringify({
            data: this.metadataConverter.toObject(metadata)
        });

        this.downloadDM.updateDownloadTask(downloadTask);

        this.logger.info("download task executed successfully");
    }

    private async updateDownloadTaskStatusFromPendingToDownloading(downloadTaskId: number): Promise<DownloadTask> {
        return this.downloadDM.withTransaction(async (downloadDM) => {
            const downloadTask = await downloadDM.getDownloadTaskWithXLock(downloadTaskId);
            if (downloadTask === null) {
                this.logger.error("download task not found, will skip");
                throw new Error("download task not found, will skip");
            }

            if (downloadTask.downloadStatus !== DownloadStatus.DOWNLOAD_STATUS_PENDING) {
                this.logger.error("download task is not in pending status, will not execute");
                throw new Error("download task is not in pending status, will not execute");
            }

            downloadTask.downloadStatus = DownloadStatus.DOWNLOAD_STATUS_DOWNLOADING;
            await downloadDM.updateDownloadTask(downloadTask);

            return downloadTask;
        });
    }

    private async updateDownloadTaskStatusToFailed(downloadTask: DownloadTask) {
        downloadTask.downloadStatus = DownloadStatus.DOWNLOAD_STATUS_FAILED;
        await this.downloadDM.updateDownloadTask(downloadTask);
    }
}

injected(
    DownloadTaskManagementOperatorImpl,
    FILE_CLIENT_TOKEN,
    DOWNLOAD_TASK_DATA_ACCESSOR_TOKEN,
    DOWNLOAD_TASK_CREATED_PRODUCER_TOKEN,
    METADATA_CONVERTER_TOKEN,
    LOGGER_TOKEN
);

export const DOWNLOAD_TASK_MANAGEMENT_OPERATOR_TOKEN = token<DownloadTaskManagementOperator>("DownloadTaskManagementOperator");
