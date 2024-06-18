import { injected, token } from "brandi";
import fs from "fs";
import httpStatus from "http-status";
import { Client } from "minio";
import { Logger } from "winston";
import { DOWNLOAD_CONFIG_TOKEN, DownloadConfig } from "../../config";
import { EXECUTE_ALL_PENDING_DOWNLOAD_TASK_QUEUE_TOKEN, ExecuteAllPendingDownloadTaskQueue } from "../../dataaccess/bull";
import {
    DOWNLOAD_TASK_DATA_ACCESSOR_TOKEN,
    DownloadStatus,
    DownloadTask,
    DownloadTaskDataAccessor,
    DownloadType
} from "../../dataaccess/db";
import { LOCAL_CLIENT_TOKEN, LocalClient, S3_CLIENT_TOKEN } from "../../dataaccess/file";
import { DOWNLOAD_TASK_CREATED_PRODUCER_TOKEN, DownloadTaskCreatedProducer } from "../../dataaccess/mq";
import { ErrorWithHTTPCode, LOGGER_TOKEN, METADATA_CONVERTER_TOKEN, MetadataConverter } from "../../utils";
import { Downloader, HTTPDownloader } from "./downloader";

const DownloadTaskMetadataFieldNameFileName = "file-name";

export interface UpdateDownloadTaskParams {
    downloadTaskId: number,
    url: string;
}

export interface DownloadTaskManagementOperator {
    createDownloadTask(userId: number, downloadType: DownloadType, url: string): Promise<DownloadTask>;
    executeDownloadTask(downloadTaskId: number): Promise<void>;
    getDownloadTaskFile(downloadTaskId: number): Promise<fs.ReadStream>;
    updateDownloadTask(params: UpdateDownloadTaskParams): Promise<DownloadTask>;
    deleteDownloadTask(downloadTaskId: number): Promise<void>;
    getDownloadTaskList(
        userId: number,
        offset: number,
        limit: number
    ): Promise<{
        totalDownloadTaskCount: number,
        downloadTaskList: DownloadTask[];
    }>;
    updateDownloadingAndFailedDownloadTaskStatusToPending(): Promise<void>;
    executeAllPendingDownloadTask(): Promise<void>;
}

export class DownloadTaskManagementOperatorImpl implements DownloadTaskManagementOperator {
    constructor(
        private readonly localClient: LocalClient,
        private readonly minioClient: Client,
        private readonly downloadDM: DownloadTaskDataAccessor,
        private readonly downloadTaskCreatedProducer: DownloadTaskCreatedProducer,
        private readonly executeAllPendingDownloadTaskQueue: ExecuteAllPendingDownloadTaskQueue,
        private readonly metadataConverter: MetadataConverter,
        private readonly downloadConfig: DownloadConfig,
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
                downloader = new HTTPDownloader(downloadTask.url, this.logger, this.minioClient, this.downloadConfig);
                break;
            default:
                this.logger.error(`${downloadTask.downloadType} unsupported download type`);
                await this.updateDownloadTaskStatusToFailed(downloadTask);
                return;
        }

        const fileName = `download_file_${downloadTaskId}`;

        switch (this.downloadConfig.mode) {
            case "s3": {
                const metadata = await downloader.downloadS3(fileName);
                await this.updateDownloadTaskAfterDownloading(metadata, downloadTask, fileName);
                break;
            }
            case "local": {
                const fileWriteCloser = this.localClient.write(fileName);
                if (fileWriteCloser === null) {
                    await this.updateDownloadTaskStatusToFailed(downloadTask);
                    this.logger.error("failed to get download file writer");
                    return;
                }
                const metadata = await downloader.downloadLocal(fileWriteCloser);
                await this.updateDownloadTaskAfterDownloading(metadata, downloadTask, fileName);
                break;
            }
            default:
                this.logger.error(`${this.downloadConfig.mode} unsupported download mode`);
                return;
        }
    }

    public async getDownloadTaskFile(downloadTaskId: number): Promise<fs.ReadStream> {
        const downloadTask = await this.downloadDM.getDownloadTask(downloadTaskId);
        if (downloadTask === null) {
            this.logger.error("no download task with id found", { downloadTaskId });
            throw new ErrorWithHTTPCode("no download task with id found", httpStatus.BAD_REQUEST);
        }

        if (downloadTask.downloadStatus !== DownloadStatus.DOWNLOAD_STATUS_SUCCESS) {
            this.logger.error("download task does not have status of success");
            throw new ErrorWithHTTPCode("download task does not have status of success", httpStatus.INTERNAL_SERVER_ERROR);
        }

        const downloadTaskMetadata = JSON.parse(downloadTask.metadata).data;
        const fileName = downloadTaskMetadata[DownloadTaskMetadataFieldNameFileName];
        if (!fileName) {
            this.logger.error("download task metadata does not contain file name");
            throw new ErrorWithHTTPCode("download task metadata does not contain file name", httpStatus.INTERNAL_SERVER_ERROR);
        }

        return this.localClient.read(fileName);
    }

    public async updateDownloadTask(params: UpdateDownloadTaskParams): Promise<DownloadTask> {
        if (params.downloadTaskId === undefined) {
            this.logger.error("downloadTaskId is requirement");
            throw new ErrorWithHTTPCode("downloadTaskId is requirement", httpStatus.BAD_REQUEST);
        }

        return this.downloadDM.withTransaction(async (downloadDM) => {
            const downloadTask = await downloadDM.getDownloadTaskWithXLock(params.downloadTaskId);
            if (downloadTask === null) {
                this.logger.error("downloadTask with id not found", { id: params.downloadTaskId });
                throw new ErrorWithHTTPCode("downloadTask with id not found", httpStatus.BAD_REQUEST);
            }

            downloadTask.url = params.url;
            await this.downloadDM.updateDownloadTask(downloadTask);
            return downloadTask;
        });
    }

    public async deleteDownloadTask(downloadTaskId: number): Promise<void> {
        return this.downloadDM.withTransaction(async (downloadDM) => {
            const downloadTask = await downloadDM.getDownloadTaskWithXLock(downloadTaskId);
            if (downloadTask === null) {
                this.logger.error("downloadTask with id not found", { id: downloadTaskId });
                throw new ErrorWithHTTPCode("downloadTask with id not found", httpStatus.BAD_REQUEST);
            }

            await this.downloadDM.deleteDownloadTask(downloadTaskId);
        });
    }

    public async getDownloadTaskList(userId: number, offset: number, limit: number): Promise<{
        totalDownloadTaskCount: number,
        downloadTaskList: DownloadTask[];
    }> {
        const totalDownloadTaskCount = await this.downloadDM.getDownloadTaskCountOfUser(userId);
        const downloadTaskList = await this.downloadDM.getDownloadTaskListOfUser(userId, offset, limit);

        return {
            totalDownloadTaskCount: totalDownloadTaskCount,
            downloadTaskList: downloadTaskList
        };
    }

    public async executeAllPendingDownloadTask(): Promise<void> {
        const pendingDownloadTaskIdList = await this.downloadDM.getPendingDownloadTaskIDList();
        if (pendingDownloadTaskIdList.length === 0) {
            this.logger.info("no pending download task found");
            return;
        }

        this.logger.info(`length pending download task ${pendingDownloadTaskIdList.length}`);

        await Promise.all(
            pendingDownloadTaskIdList.map((id) => {
                this.executeAllPendingDownloadTaskQueue.add(id);
            })
        );

        this.logger.info("successfully to execute all pending download task");
    }

    public async updateDownloadingAndFailedDownloadTaskStatusToPending(): Promise<void> {
        return this.downloadDM.updateDownloadingAndFailedDownloadTaskStatusToPending();
    }

    private async updateDownloadTaskAfterDownloading(
        metadata: Map<string, any> | null,
        downloadTask: DownloadTask,
        fileName: string
    ): Promise<void> {
        if (metadata === null) {
            await this.updateDownloadTaskStatusToFailed(downloadTask);
            return;
        }

        metadata.set(DownloadTaskMetadataFieldNameFileName, fileName);
        downloadTask.downloadStatus = DownloadStatus.DOWNLOAD_STATUS_SUCCESS;
        downloadTask.metadata = JSON.stringify({
            data: this.metadataConverter.toObject(metadata)
        });

        this.downloadDM.updateDownloadTask(downloadTask);

        this.logger.info(`download task with download_task_id=${downloadTask.id} executed successfully`);
    }

    private async updateDownloadTaskStatusFromPendingToDownloading(downloadTaskId: number): Promise<DownloadTask> {
        return this.downloadDM.withTransaction(async (downloadDM) => {
            const downloadTask = await downloadDM.getDownloadTaskWithXLock(downloadTaskId);
            if (downloadTask === null) {
                this.logger.error("download task not found, will skip");
                throw new ErrorWithHTTPCode("download task not found, will skip", httpStatus.BAD_REQUEST);
            }

            if (downloadTask.downloadStatus !== DownloadStatus.DOWNLOAD_STATUS_PENDING) {
                this.logger.error(`download task with download_task_id=${downloadTaskId} is not in pending status, will not execute`);
                throw new ErrorWithHTTPCode("download task is not in pending status, will not execute", httpStatus.INTERNAL_SERVER_ERROR);
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
    LOCAL_CLIENT_TOKEN,
    S3_CLIENT_TOKEN,
    DOWNLOAD_TASK_DATA_ACCESSOR_TOKEN,
    DOWNLOAD_TASK_CREATED_PRODUCER_TOKEN,
    EXECUTE_ALL_PENDING_DOWNLOAD_TASK_QUEUE_TOKEN,
    METADATA_CONVERTER_TOKEN,
    DOWNLOAD_CONFIG_TOKEN,
    LOGGER_TOKEN
);

export const DOWNLOAD_TASK_MANAGEMENT_OPERATOR_TOKEN = token<DownloadTaskManagementOperator>("DownloadTaskManagementOperator");
