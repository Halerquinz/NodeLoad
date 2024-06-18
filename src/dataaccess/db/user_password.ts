import { Knex } from "knex";
import { Logger } from "winston";
import { ErrorWithHTTPCode, LOGGER_TOKEN } from "../../utils";
import { injected, token } from "brandi";
import { KNEX_INSTANCE_TOKEN } from "./knex";
import httpStatus from "http-status";

export interface UserPasswordDataAccessor {
    createUserPassword(ofUserId: number, hash: string): Promise<void>;
    updateUserPassword(ofUserId: number, hash: string): Promise<void>;
    getUserPasswordHash(ofUserId: number): Promise<string | null>;
    getUserPasswordHashWithXLock(ofUserId: number): Promise<string | null>;
    withTransaction<T>(cb: (dataAccessor: UserPasswordDataAccessor) => Promise<T>): Promise<T>;
}

const TabNameUserPassword = "user_password";
const ColNameUserPasswordOfUserId = "of_user_id";
const ColNameUserPasswordHash = "hash";

export class UserPasswordDataAccessorImpl implements UserPasswordDataAccessor {
    constructor(private readonly knex: Knex<any, any[]>, private readonly logger: Logger) { }

    public async createUserPassword(ofUserId: number, hash: string): Promise<void> {
        try {
            await this.knex
                .insert({
                    [ColNameUserPasswordOfUserId]: ofUserId,
                    [ColNameUserPasswordHash]: hash
                })
                .into(TabNameUserPassword);
        } catch (error) {
            this.logger.error("failed to create user password", { error });
            throw new ErrorWithHTTPCode("failed to create user password", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async updateUserPassword(ofUserId: number, hash: string): Promise<void> {
        try {
            await this.knex
                .table(TabNameUserPassword)
                .update({
                    [ColNameUserPasswordHash]: hash,
                })
                .where({
                    [ColNameUserPasswordOfUserId]: ofUserId,
                });
        } catch (error) {
            this.logger.error("failed to update user password", { error });
            throw new ErrorWithHTTPCode("failed to update user password", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async getUserPasswordHash(ofUserId: number): Promise<string | null> {
        let rows;
        try {
            rows = await this.knex
                .select([ColNameUserPasswordHash])
                .from(TabNameUserPassword)
                .where({
                    [ColNameUserPasswordOfUserId]: ofUserId,
                });
        } catch (error) {
            this.logger.error("failed to get user password hash", { error });
            throw new ErrorWithHTTPCode("failed to get user password hash", httpStatus.INTERNAL_SERVER_ERROR);
        }

        if (rows.length === 0) {
            this.logger.debug("no user password of user_id found", {
                userId: ofUserId,
            });
            return null;
        }

        return rows[0][ColNameUserPasswordHash];
    }


    public async getUserPasswordHashWithXLock(ofUserId: number): Promise<string | null> {
        let rows;
        try {
            rows = await this.knex
                .select([ColNameUserPasswordHash])
                .from(TabNameUserPassword)
                .where({
                    [ColNameUserPasswordOfUserId]: ofUserId,
                })
                .forUpdate();
        } catch (error) {
            this.logger.error("failed to get user password hash", { error });
            throw new ErrorWithHTTPCode("failed to get user password hash", httpStatus.INTERNAL_SERVER_ERROR);
        }

        if (rows.length === 0) {
            this.logger.debug("no user password of user_id found", {
                userId: ofUserId,
            });
            return null;
        }

        return rows[0][ColNameUserPasswordHash];
    }


    public async withTransaction<T>(cb: (dataAccessor: UserPasswordDataAccessor) => Promise<T>): Promise<T> {
        return this.knex.transaction(async (trx) => {
            const trxDataAccessor = new UserPasswordDataAccessorImpl(trx, this.logger);
            return cb(trxDataAccessor);
        });
    }
}

injected(UserPasswordDataAccessorImpl, KNEX_INSTANCE_TOKEN, LOGGER_TOKEN);

export const USER_PASSWORD_DATA_ACCESSOR_TOKEN = token<UserPasswordDataAccessor>("UserPasswordDataAccessor");