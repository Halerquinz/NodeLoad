import { injected, token } from "brandi";
import { Logger } from "winston";
import { BullWorker, QueueNameExecuteAllPendingDownloadTask, WORKER_TOKEN } from "../../dataaccess/bull";
import { DOWNLOAD_TASK_MANAGEMENT_OPERATOR_TOKEN, DownloadTaskManagementOperator } from "../../module/download_task";
import { LOGGER_TOKEN } from "../../utils";

export class ServerWorker {
    constructor(
        private readonly worker: BullWorker,
        private readonly downloadTaskManagementOperator: DownloadTaskManagementOperator,
        private readonly logger: Logger
    ) { }

    public start(): void {
        this.worker
            .registerHandlerListAndStart([
                {
                    topic: QueueNameExecuteAllPendingDownloadTask,
                    onProcess: (job: any) => {
                        return this.downloadTaskManagementOperator.executeDownloadTask(job.data.downloadTaskId);
                    }
                },
            ])
            .then(() => {
                if (process.send) {
                    process.send("ready");
                }
            });

        this.logger.info("worker started");
    }
}

injected(
    ServerWorker,
    WORKER_TOKEN,
    DOWNLOAD_TASK_MANAGEMENT_OPERATOR_TOKEN,
    LOGGER_TOKEN
);

export const SERVER_WORKER_TOKEN = token<ServerWorker>("ServerWorker");