import { token } from "brandi";

export class CronConfig {
    public executeAllPendingDownloadTaskSchedule = "*/1 * * * *"; // every 1m
    public executeAllPendingDownloadTaskScheduleConcurrencyLimit = 6;
    public updateDownloadingAndFailedDownloadTaskStatusToPendingSchedule = "*/30 * * * *"; // every 10m

    public static fromEnv(): CronConfig {
        const config = new CronConfig();
        if (process.env.EXECUTE_ALL_PENDING_DOWNLOAD_TASK_SCHEDULE !== undefined) {
            config.executeAllPendingDownloadTaskSchedule = process.env.EXECUTE_ALL_PENDING_DOWNLOAD_TASK_SCHEDULE;
        }
        if (process.env.EXECUTE_ALL_PENDING_DOWNLOAD_TASK_CONCURRENCY_LIMIT !== undefined) {
            config.executeAllPendingDownloadTaskScheduleConcurrencyLimit = +process.env.EXECUTE_ALL_PENDING_DOWNLOAD_TASK_CONCURRENCY_LIMIT;
        }
        if (process.env.UPDATE_DOWNLOADING_AND_FAILED_DOWNLOAD_TASK_STATUS_TO_PENDING_SCHEDULE !== undefined) {
            config.updateDownloadingAndFailedDownloadTaskStatusToPendingSchedule =
                process.env.UPDATE_DOWNLOADING_AND_FAILED_DOWNLOAD_TASK_STATUS_TO_PENDING_SCHEDULE;
        }
        return config;
    }
}

export const CRON_CONFIG_TOKEN = token<CronConfig>("CronConfig");
