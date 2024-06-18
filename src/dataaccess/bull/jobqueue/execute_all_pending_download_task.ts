import { Logger } from "winston";
import { injected, token } from "brandi";
import { LOGGER_TOKEN } from "../../../utils";
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { REDIS_INSTANCE_TOKEN } from "../redis";

export const QueueNameExecuteAllPendingDownloadTask = "execute_all_pending_download_task";

export interface ExecuteAllPendingDownloadTaskQueue {
    add(downloadTaskId: number): Promise<void>;
}

export class ExecuteAllPendingDownloadTaskQueueImpl implements ExecuteAllPendingDownloadTaskQueue {
    private readonly executeAllPendingDownloadTaskQueue: Queue;

    constructor(
        private readonly logger: Logger,
        private readonly redis: Redis,
    ) {
        this.executeAllPendingDownloadTaskQueue =
            new Queue(QueueNameExecuteAllPendingDownloadTask, { connection: this.redis });
    }

    public async add(downloadTaskId: number): Promise<void> {
        await this.executeAllPendingDownloadTaskQueue.add(
            QueueNameExecuteAllPendingDownloadTask,
            { downloadTaskId: downloadTaskId },
            { attempts: 1 }
        );

        this.logger.info(`successfully to add ExecuteAllPendingDownloadTaskQueue with download_task_id=${downloadTaskId}`);
    }
}
injected(
    ExecuteAllPendingDownloadTaskQueueImpl,
    LOGGER_TOKEN,
    REDIS_INSTANCE_TOKEN
);

export const EXECUTE_ALL_PENDING_DOWNLOAD_TASK_QUEUE_TOKEN =
    token<ExecuteAllPendingDownloadTaskQueue>("ExecuteAllPendingDownloadTaskQueue");