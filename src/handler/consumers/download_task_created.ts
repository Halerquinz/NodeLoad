import { injected, token } from "brandi";
import { Logger } from "winston";
import { DOWNLOAD_TASK_MANAGEMENT_OPERATOR_TOKEN, DownloadTaskManagementOperator } from "../../module/download_task";
import { DownloadTaskCreated } from "../../dataaccess/mq";
import { LOGGER_TOKEN } from "../../utils";

export interface DownloadTaskCreatedMessageHandler {
    onDownloadTaskCreated(message: DownloadTaskCreated): Promise<void>;
}

export class DownloadTaskCreatedMessageHandlerImpl implements DownloadTaskCreatedMessageHandler {
    constructor(
        private readonly downloadTaskManagementOperator: DownloadTaskManagementOperator,
        private readonly logger: Logger
    ) { }

    public async onDownloadTaskCreated(message: DownloadTaskCreated): Promise<void> {
        this.logger.info("download_task_created message received", { payload: message });

        const downloadTaskId = message.id;
        if (downloadTaskId === undefined) {
            this.logger.error("download_task_id is required", { payload: message });
            return;
        }

        await this.downloadTaskManagementOperator.executeDownloadTask(downloadTaskId);
    }
}

injected(
    DownloadTaskCreatedMessageHandlerImpl,
    DOWNLOAD_TASK_MANAGEMENT_OPERATOR_TOKEN,
    LOGGER_TOKEN
);

export const DOWNLOAD_TASK_CREATED_MESSAGE_HANDLER_TOKEN =
    token<DownloadTaskCreatedMessageHandler>("DownloadTaskCreatedMessageHandler");