import { injected, token } from "brandi";
import { DOWNLOAD_TASK_MANAGEMENT_OPERATOR_TOKEN, DownloadTaskManagementOperator } from "../../module/download_task";

export interface ExecuteAllPendingDownloadTask {
    run(): Promise<void>;
}

export class ExecuteAllPendingDownloadTaskImpl implements ExecuteAllPendingDownloadTask {
    constructor(
        private readonly downloadTaskDM: DownloadTaskManagementOperator
    ) { }

    public async run(): Promise<void> {
        return this.downloadTaskDM.executeAllPendingDownloadTask();
    }
}

injected(ExecuteAllPendingDownloadTaskImpl, DOWNLOAD_TASK_MANAGEMENT_OPERATOR_TOKEN);

export const EXECUTE_ALL_PENDING_DOWNLOAD_TASK_TOKEN =
    token<ExecuteAllPendingDownloadTask>("ExecuteAllPendingDownloadTask");