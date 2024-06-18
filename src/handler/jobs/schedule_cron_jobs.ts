import { Logger } from "winston";
import { CRON_CONFIG_TOKEN, CronConfig } from "../../config";
import { EXECUTE_ALL_PENDING_DOWNLOAD_TASK_TOKEN, ExecuteAllPendingDownloadTask } from "./execute_all_pending_download_task";
import {
    UPDATE_DOWNLOADING_AND_FAILED_DOWNLOAD_TASK_STATUS_TO_PENDING_TOKEN,
    UpdateDownloadingAndFailedDownloadTaskStatusToPending
} from "./update_downloading_and_failed_download_task_status_to_pending";
import { CronJob } from "cron";
import { injected, token } from "brandi";
import { LOGGER_TOKEN } from "../../utils";

export class ScheduleCronJobs {
    constructor(
        private readonly logger: Logger,
        private readonly cronConfig: CronConfig,
        private readonly executeAllPendingDownloadTaskJob: ExecuteAllPendingDownloadTask,
        private readonly updateDownloadingAndFailedDownloadTaskStatusToPendingJob: UpdateDownloadingAndFailedDownloadTaskStatusToPending
    ) { }

    public async start() {
        new CronJob(this.cronConfig.executeAllPendingDownloadTaskSchedule, async () => {
            try {
                await this.executeAllPendingDownloadTaskJob.run();
            } catch (error) {
                this.logger.error("failed to run execute all pending download task job", { error });
            }
        }, null, true);

        new CronJob(this.cronConfig.executeAllPendingDownloadTaskSchedule, async () => {
            try {
                await this.updateDownloadingAndFailedDownloadTaskStatusToPendingJob.run();
            } catch (error) {
                this.logger.error("failed to run update downloading and failed download task status to pending job", { error });
            }
        }, null, true);

        this.logger.info("scheduled all cron jobs successfully");
    }
}

injected(
    ScheduleCronJobs,
    LOGGER_TOKEN,
    CRON_CONFIG_TOKEN,
    EXECUTE_ALL_PENDING_DOWNLOAD_TASK_TOKEN,
    UPDATE_DOWNLOADING_AND_FAILED_DOWNLOAD_TASK_STATUS_TO_PENDING_TOKEN
);

export const SCHEDULE_CRON_JOBS_TOKEN = token<ScheduleCronJobs>("ScheduleCronJobs");