import { injected, token } from "brandi";
import { DOWNLOAD_TASK_MANAGEMENT_OPERATOR_TOKEN, DownloadTaskManagementOperator } from "../../module/download_task";

export interface UpdateDownloadingAndFailedDownloadTaskStatusToPending {
    run(): Promise<void>;
}

export class UpdateDownloadingAndFailedDownloadTaskStatusToPendingImpl implements UpdateDownloadingAndFailedDownloadTaskStatusToPending {
    constructor(
        private readonly downloadTaskDM: DownloadTaskManagementOperator
    ) { }

    public async run(): Promise<void> {
        return this.downloadTaskDM.updateDownloadingAndFailedDownloadTaskStatusToPending();
    }
}

injected(UpdateDownloadingAndFailedDownloadTaskStatusToPendingImpl, DOWNLOAD_TASK_MANAGEMENT_OPERATOR_TOKEN);

export const UPDATE_DOWNLOADING_AND_FAILED_DOWNLOAD_TASK_STATUS_TO_PENDING_TOKEN =
    token<UpdateDownloadingAndFailedDownloadTaskStatusToPending>("UpdateDownloadingAndFailedDownloadTaskStatusToPending");