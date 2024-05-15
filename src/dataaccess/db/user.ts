import { Knex } from "knex";
import { Logger, query } from "winston";
import { ErrorWithHTTPCode } from "../../utils/errors";
import { injected, token } from "brandi";
import { KNEX_INSTANCE_TOKEN } from "./knex";
import { LOGGER_TOKEN } from "../../utils/logging";
import httpStatus from "http-status";

export class User {
    constructor(public id: number, public username: string, public displayName: string) { }
}

export interface UserDataAccessor {
    createUser(username: string, displayName: string): Promise<number>;
    updateUser(user: User): Promise<void>;
    getUserByUserId(userId: number): Promise<User | null>;
    getUserByUserIdWithXLock(userId: number): Promise<User | null>;
    getUserByUsername(username: string): Promise<User | null>;
    getUserByUsernameWithXLock(username: string): Promise<User | null>;
    withTransaction<T>(cb: (dataAccessor: UserDataAccessor) => Promise<T>): Promise<T>;
}

const TabNameUser = "user";
const ColNameUserId = "user_id";
const ColNameUserUsername = "username";
const ColNameUserDisplayName = "display_name";

export default class UserDataAccessorImpl implements UserDataAccessor {
    constructor(private readonly knex: Knex<any, any[]>, private readonly logger: Logger) { }

    public async createUser(username: string, displayName: string): Promise<number> {
        try {
            const rows = await this.knex
                .insert({
                    [ColNameUserUsername]: username,
                    [ColNameUserDisplayName]: displayName
                })
                .into(TabNameUser);
            return +rows[0];
        } catch (error) {
            this.logger.error("failed to create user", {
                username,
                displayName,
                error
            });
            throw new ErrorWithHTTPCode("failed to create user", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async updateUser(user: User): Promise<void> {
        try {
            const row = await this.knex
                .table(TabNameUser)
                .update({
                    [ColNameUserUsername]: user.username,
                    [ColNameUserDisplayName]: user.displayName
                })
                .where(ColNameUserId, user.id);
        } catch (error) {
            this.logger.error("failed to update user profile", {
                user
            })
            throw new ErrorWithHTTPCode("failed to update user profile", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async getUserByUserId(userId: number): Promise<User | null> {
        let rows: Record<string, any>;
        try {
            rows = await this.knex
                .select()
                .from(TabNameUser)
                .where({
                    [ColNameUserId]: userId
                });
        } catch (error) {
            this.logger.error("failed to get user by userId", {
                userId
            })
            throw new ErrorWithHTTPCode("failed to get user by userId", httpStatus.INTERNAL_SERVER_ERROR);
        }

        if (rows.length === 0) {
            this.logger.error("cannot found user with userId", { userId });
            return null;
        }

        if (rows.length > 1) {
            this.logger.error("more than one user with userId", { userId });
            throw new ErrorWithHTTPCode("more than one user with userId", httpStatus.INTERNAL_SERVER_ERROR);
        }

        return this.getUserFromRow(rows[0]);
    }

    public async getUserByUserIdWithXLock(userId: number): Promise<User | null> {
        let rows: Record<string, any>;
        try {
            rows = await this.knex
                .select()
                .from(TabNameUser)
                .where({
                    [ColNameUserId]: userId
                })
                .forUpdate();
        } catch (error) {
            this.logger.error("failed to get user by userId", {
                userId
            });
            throw new ErrorWithHTTPCode("failed to get user by userId", httpStatus.INTERNAL_SERVER_ERROR);
        }

        if (rows.length === 0) {
            this.logger.error("cannot found user with userId", { userId });
            return null;
        }

        if (rows.length > 1) {
            this.logger.error("more than one user with userId", { userId });
            throw new ErrorWithHTTPCode("more than one user with userId", httpStatus.INTERNAL_SERVER_ERROR);
        }

        return this.getUserFromRow(rows[0]);
    }

    public async getUserByUsername(username: string): Promise<User | null> {
        let rows: Record<string, any>;
        try {
            rows = await this.knex
                .select()
                .from(TabNameUser)
                .where({
                    [ColNameUserUsername]: username
                });
        } catch (error) {
            this.logger.error("failed to get user by username", {
                username
            });
            throw new ErrorWithHTTPCode("failed to get user by username", httpStatus.INTERNAL_SERVER_ERROR);
        }

        if (rows.length == 0) {
            this.logger.debug("no user with username found", { username });
            return null;
        }

        if (rows.length > 1) {
            this.logger.error("more than one user with username", { username });
            throw new ErrorWithHTTPCode("more than one user with username", httpStatus.INTERNAL_SERVER_ERROR);
        }

        return this.getUserFromRow(rows[0]);
    }

    public async getUserByUsernameWithXLock(username: string): Promise<User | null> {
        let rows: Record<string, any>;
        try {
            rows = await this.knex
                .select()
                .from(TabNameUser)
                .where({
                    [ColNameUserUsername]: username
                })
                .forUpdate();

        } catch (error) {
            this.logger.error("failed to get user by username", {
                username
            });
            throw new ErrorWithHTTPCode("failed to get user by username", httpStatus.INTERNAL_SERVER_ERROR);
        }

        if (rows.length == 0) {
            this.logger.debug("no user with username found", { username });
            return null;
        }

        if (rows.length > 1) {
            this.logger.error("more than one user with username", { username });
            throw new ErrorWithHTTPCode("more than one user with username", httpStatus.INTERNAL_SERVER_ERROR);
        }

        return this.getUserFromRow(rows[0]);
    }

    public async withTransaction<T>(cb: (dataAccessor: UserDataAccessor) => Promise<T>): Promise<T> {
        return this.knex.transaction(async (trx) => {
            const trxDataAccessor = new UserDataAccessorImpl(trx, this.logger);
            return cb(trxDataAccessor);
        })
    }

    private getUserFromRow(row: Record<string, any>): User {
        return new User(
            +row[ColNameUserId],
            row[ColNameUserUsername],
            row[ColNameUserDisplayName]
        );
    }
}

injected(UserDataAccessorImpl, KNEX_INSTANCE_TOKEN, LOGGER_TOKEN);

export const USER_DATA_ACCESSOR_TOKEN = token<UserDataAccessor>("UserDataAccessor");