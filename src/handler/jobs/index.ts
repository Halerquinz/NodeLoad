import { Container } from "brandi";
import { EXECUTE_ALL_PENDING_DOWNLOAD_TASK_TOKEN, ExecuteAllPendingDownloadTaskImpl } from "./execute_all_pending_download_task";
import {
    UPDATE_DOWNLOADING_AND_FAILED_DOWNLOAD_TASK_STATUS_TO_PENDING_TOKEN,
    UpdateDownloadingAndFailedDownloadTaskStatusToPendingImpl
} from "./update_downloading_and_failed_download_task_status_to_pending";
import { SCHEDULE_CRON_JOBS_TOKEN, ScheduleCronJobs } from "./schedule_cron_jobs";

export * from "./execute_all_pending_download_task";
export * from "./update_downloading_and_failed_download_task_status_to_pending";
export * from "./schedule_cron_jobs";

export function bindToContainer(container: Container): void {
    container.bind(EXECUTE_ALL_PENDING_DOWNLOAD_TASK_TOKEN).toInstance(ExecuteAllPendingDownloadTaskImpl).inSingletonScope();
    container.bind(UPDATE_DOWNLOADING_AND_FAILED_DOWNLOAD_TASK_STATUS_TO_PENDING_TOKEN)
        .toInstance(UpdateDownloadingAndFailedDownloadTaskStatusToPendingImpl)
        .inSingletonScope();
    container.bind(SCHEDULE_CRON_JOBS_TOKEN).toInstance(ScheduleCronJobs).inSingletonScope();
}