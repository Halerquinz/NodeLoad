import { Knex } from "knex";
import { Logger } from "winston";
import { ErrorWithHTTPCode, LOGGER_TOKEN } from "../../utils";
import { injected, token } from "brandi";
import { KNEX_INSTANCE_TOKEN } from "./knex";
import httpStatus from "http-status";

export enum DownloadTaskType {
    DOWNLOAD_TYPE_UNSPECIFIED = 0,
    DOWNLOAD_TYPE_HTTP = 1,
}

export enum DownloadTaskStatus {
    DOWNLOAD_STATUS_UNSPECIFIED = 0,
    DOWNLOAD_STATUS_PENDING = 1,
    DOWNLOAD_STATUS_DOWNLOADING = 2,
    DOWNLOAD_STATUS_FAILED = 3,
    DOWNLOAD_STATUS_SUCCESS = 4,
}

export class DownloadTask {
    constructor(
        public id: number,
        public ofUserId: number,
        public downloadTaskType: DownloadTaskType,
        public downloadTaskStatus: DownloadTaskStatus,
        public url: string,
        public metadata: any,
    ) { }
}

export interface DownloadTaskDataAccessor {
    createDownloadTask(task: DownloadTask): Promise<number>;
    getDownloadTaskListOfUser(userId: number, offset: number, limit: number): Promise<DownloadTask[]>;
    getDownloadTaskCountOfUser(userId: number): Promise<number>;
    getDownloadTask(id: number): Promise<DownloadTask | null>;
    getDownloadTaskWithXLock(id: number): Promise<DownloadTask | null>;
    updateDownloadTask(task: DownloadTask): Promise<void>;
    deleteDownloadTask(id: number): Promise<void>;
    getPendingDownloadTaskIDList(): Promise<number[]>;
    updateDownloadingAndFailedDownloadTaskStatusToPending(): Promise<void>;
    withTransaction<T>(cb: (dataAccessor: DownloadTaskDataAccessor) => Promise<T>): Promise<T>;
}

const TabNameDownloadTask = "download_task";
const ColNameDownloadTaskId = "download_task_id";
const ColNameDownloadTaskOfUserId = "of_user_id";
const ColNameDownloadTaskDownloadType = "download_type";
const ColNameDownloadTaskDownloadStatus = "download_status";
const ColNameDownloadTaskUrl = "url";
const ColNameDownloadTaskMetadata = "metadata";

export class DownloadTaskDataAccessorImpl implements DownloadTaskDataAccessor {
    constructor(private readonly knex: Knex<any, any[]>, private readonly logger: Logger) { }

    public async createDownloadTask(task: DownloadTask): Promise<number> {
        try {
            const rows = await this.knex
                .insert({
                    [ColNameDownloadTaskOfUserId]: task.ofUserId,
                    [ColNameDownloadTaskDownloadType]: task.downloadTaskType,
                    [ColNameDownloadTaskDownloadStatus]: task.downloadTaskStatus,
                    [ColNameDownloadTaskUrl]: task.url,
                    [ColNameDownloadTaskMetadata]: task.metadata,
                }
                )
                .returning(ColNameDownloadTaskId)
                .into(TabNameDownloadTask);
            return +rows[0][ColNameDownloadTaskId];
        } catch (error) {
            this.logger.error("failed to create download task", { error });
            throw new ErrorWithHTTPCode("failed to create download task", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async deleteDownloadTask(id: number): Promise<void> {
        try {
            await this.knex
                .delete()
                .from(TabNameDownloadTask)
                .where(ColNameDownloadTaskId, "=", id);
        } catch (error) {
            this.logger.error("failed to delete download task", { id, error });
            throw new ErrorWithHTTPCode("failed to delete download task", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async getDownloadTask(id: number): Promise<DownloadTask | null> {
        let rows: Record<string, any>[];
        try {
            rows = await this.knex
                .select()
                .from(TabNameDownloadTask)
                .where(ColNameDownloadTaskId, "=", id);
        } catch (error) {
            this.logger.error("failed to get download task", { id, error });
            throw new ErrorWithHTTPCode("failed to get download task", httpStatus.INTERNAL_SERVER_ERROR);
        }

        if (rows.length == 0) {
            this.logger.debug("no download task with id found", { id });
            return null;
        }

        if (rows.length > 1) {
            this.logger.error("more than one download task with id found", { id });
            throw new ErrorWithHTTPCode("more than one download task with id found", httpStatus.INTERNAL_SERVER_ERROR);
        }

        return this.getDownloadTaskFromRow(rows[0]);
    }

    public async getDownloadTaskCountOfUser(userId: number): Promise<number> {
        try {
            const rows = await this.knex
                .count()
                .from(TabNameDownloadTask)
                .where(ColNameDownloadTaskOfUserId, "=", userId);
            return (rows[0] as any)["count"];
        } catch (error) {
            this.logger.error("failed to get download task count", { error });
            throw new ErrorWithHTTPCode("failed to get download task count", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async getDownloadTaskListOfUser(userId: number, offset: number, limit: number): Promise<DownloadTask[]> {
        try {
            const rows = await this.knex
                .select()
                .from(TabNameDownloadTask)
                .where({
                    [ColNameDownloadTaskOfUserId]: userId
                })
                .offset(offset)
                .limit(limit);

            return rows.map((row) => this.getDownloadTaskFromRow(row));
        } catch (error) {
            this.logger.error("failed to get download task list of user", { userId, offset, limit, error });
            throw new ErrorWithHTTPCode("failed to get download task list of user", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async getDownloadTaskWithXLock(id: number): Promise<DownloadTask | null> {
        try {
            const rows = await this.knex
                .select()
                .from(TabNameDownloadTask)
                .where({
                    [ColNameDownloadTaskId]: id
                })
                .forUpdate();
            if (rows.length === 0) {
                this.logger.debug("no download task with id found", { bookingId: id });
                return null;
            }
            if (rows.length > 1) {
                this.logger.debug("more than one download task with id found", { bookingId: id });
                throw new ErrorWithHTTPCode("failed to get download task with id found", httpStatus.INTERNAL_SERVER_ERROR);
            }
            return this.getDownloadTaskFromRow(rows[0]);
        } catch (error) {
            this.logger.error("failed to get download task", { error });
            throw new ErrorWithHTTPCode("failed to get download task with id found", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async getPendingDownloadTaskIDList(): Promise<number[]> {
        try {
            const rows = await this.knex
                .select([ColNameDownloadTaskId])
                .from(TabNameDownloadTask)
                .where({
                    [ColNameDownloadTaskDownloadStatus]: DownloadTaskStatus.DOWNLOAD_STATUS_PENDING
                })
                .forUpdate();
            return rows.map((row) => row[ColNameDownloadTaskId]);
        } catch (error) {
            this.logger.error("failed to get pending download task id list", { error });
            throw new ErrorWithHTTPCode("failed to get pending download task id list", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async updateDownloadTask(task: DownloadTask): Promise<void> {
        try {
            await this.knex
                .table(TabNameDownloadTask)
                .update({
                    [ColNameDownloadTaskDownloadStatus]: task.downloadTaskStatus,
                    [ColNameDownloadTaskDownloadType]: task.downloadTaskType,
                    [ColNameDownloadTaskUrl]: task.url,
                    [ColNameDownloadTaskMetadata]: task.metadata
                })
                .where(ColNameDownloadTaskId, task.id);
        } catch (error) {
            this.logger.error("failed to update download task", {
                task
            })
            throw new ErrorWithHTTPCode("failed to update download task", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async updateDownloadingAndFailedDownloadTaskStatusToPending(): Promise<void> {
        try {
            await this.knex
                .table(TabNameDownloadTask)
                .update({
                    [ColNameDownloadTaskDownloadStatus]: DownloadTaskStatus.DOWNLOAD_STATUS_PENDING,
                })
                .where(ColNameDownloadTaskDownloadStatus, DownloadTaskStatus.DOWNLOAD_STATUS_PENDING)
                .orWhere(ColNameDownloadTaskDownloadStatus, DownloadTaskStatus.DOWNLOAD_STATUS_FAILED);
        } catch (error) {
            this.logger.error("failed to update downloading and failed download task status to pending", { error });
            throw new ErrorWithHTTPCode("failed to update downloading and failed download task status to pending", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async withTransaction<T>(cb: (dataAccessor: DownloadTaskDataAccessor) => Promise<T>): Promise<T> {
        return this.knex.transaction(async (trx) => {
            const trxDataAccessor = new DownloadTaskDataAccessorImpl(trx, this.logger);
            return cb(trxDataAccessor);
        })
    }

    private getDownloadTaskFromRow(row: Record<string, any>): DownloadTask {
        return new DownloadTask(
            +row[ColNameDownloadTaskId],
            +row[ColNameDownloadTaskOfUserId],
            +row[ColNameDownloadTaskDownloadType],
            +row[ColNameDownloadTaskDownloadStatus],
            row[ColNameDownloadTaskUrl],
            row[ColNameDownloadTaskMetadata]
        );
    }
}

injected(DownloadTaskDataAccessorImpl, KNEX_INSTANCE_TOKEN, LOGGER_TOKEN);

export const DOWNLOAD_TASK_DATA_ACCESSOR_TOKEN = token<DownloadTaskDataAccessor>("DownloadTaskDataAccessor");