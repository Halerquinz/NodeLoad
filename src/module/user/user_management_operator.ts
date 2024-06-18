import { injected, token } from "brandi";
import httpStatus from "http-status";
import validator from "validator";
import { Logger } from "winston";
import { USER_DATA_ACCESSOR_TOKEN, User, UserDataAccessor } from "../../dataaccess/db";
import { ErrorWithHTTPCode } from "../../utils";
import { LOGGER_TOKEN } from "../../utils/logging";
import { TAKEN_USER_NAME_CACHE_DM_TOKEN, TakenUsernameCacheDM } from "../../dataaccess/cache";

export interface UserManagementOperator {
    createUser(username: string, displayName: string): Promise<User>;
    updateUser(id: number, username: string, displayName: string): Promise<User>;
    getUser(userId: number): Promise<User>;
}

export class UserManagementOperatorImpl implements UserManagementOperator {
    constructor(
        private readonly userDM: UserDataAccessor,
        private readonly takenUsernameCacheDM: TakenUsernameCacheDM,
        private readonly logger: Logger
    ) { }

    public async createUser(username: string, displayName: string): Promise<User> {
        if (!this.isValidUsername(username)) {
            this.logger.error("invalid username", { username });
        }

        displayName = this.sanitizeDisplayName(displayName);
        if (!this.isValidDisplayName(displayName)) {
            this.logger.error("invalid displayname", { username });
            throw new ErrorWithHTTPCode("invalid displayname", httpStatus.BAD_REQUEST);
        }

        const isUsernameTaken = await this.isUsernameTaken(username);
        if (isUsernameTaken) {
            this.logger.error("username has already been taken", {
                username,
            });
            throw new ErrorWithHTTPCode("username has already been taken", httpStatus.CONFLICT);
        }

        return this.userDM.withTransaction<User>(async (dm) => {
            const createUserId = await dm.createUser(username, displayName);
            return {
                id: createUserId,
                username,
                displayName
            };
        });
    }

    public async updateUser(id: number, username: string, displayName: string): Promise<User> {
        if (id === undefined) {
            this.logger.error("userId is requirement");
            throw new ErrorWithHTTPCode("userId is requirement", httpStatus.BAD_REQUEST);
        }

        if (username !== undefined) {
            if (!this.isValidUsername(username)) {
                this.logger.error("invalid username");
                throw new ErrorWithHTTPCode("invalid username", httpStatus.BAD_REQUEST);
            }
        }

        if (displayName !== undefined) {
            if (!this.isValidDisplayName(displayName)) {
                this.logger.error("invalid displayName");
                throw new ErrorWithHTTPCode("invalid displayName", httpStatus.BAD_REQUEST);
            }
        }

        return this.userDM.withTransaction<User>(async (userDM) => {
            const userRecord = await userDM.getUserByUserIdWithXLock(id);
            if (userRecord === null) {
                this.logger.error("can not find user with userId");
                throw new ErrorWithHTTPCode("can not find user with userId", httpStatus.BAD_REQUEST);
            }

            if (username !== undefined) {
                const userWithUsernameRecord = await userDM.getUserByUsernameWithXLock(username);
                if (userWithUsernameRecord !== null && userWithUsernameRecord.id !== id) {
                    this.logger.error("username already exist");
                    throw new ErrorWithHTTPCode("username already exist", httpStatus.CONFLICT);
                }

                userRecord.username = username;
            }

            await userDM.updateUser({ username, displayName, id });

            if (displayName !== undefined) {
                userRecord.displayName = displayName;
            }

            return userRecord;
        });
    }

    public async getUser(userId: number): Promise<User> {
        const user = await this.userDM.getUserByUserId(userId);
        if (user === null) {
            this.logger.error("can not find user with userId");
            throw new ErrorWithHTTPCode("can not find user with userId", httpStatus.BAD_REQUEST);
        }

        return user;
    }

    private async isUsernameTaken(username: string): Promise<boolean> {
        try {
            const usernameTakenInCache = await this.takenUsernameCacheDM.has(username);
            if (usernameTakenInCache) {
                return true;
            }
        } catch (error) {
            this.logger.warn("failed to get account name from taken set in cache, will fall back to database");
        }

        const usernameTakenInDB = await this.userDM.getUserByUsernameWithXLock(username);
        if (usernameTakenInDB === null) {
            return false;
        }

        try {
            await this.takenUsernameCacheDM.add(username);
        } catch (error) {
            this.logger.warn("cannot set username taken key to cache", { username });
        }

        return true;
    }

    private sanitizeDisplayName(displayName: string): string {
        return validator.escape(validator.trim(displayName));
    }

    private isValidUsername(username: string): boolean {
        return validator.isLength(username, { min: 6, max: 64 }) && validator.isAlphanumeric(username);
    }

    private isValidDisplayName(displayName: string): boolean {
        return validator.isLength(displayName, { min: 1, max: 256 });
    }
}

injected(UserManagementOperatorImpl, USER_DATA_ACCESSOR_TOKEN, TAKEN_USER_NAME_CACHE_DM_TOKEN, LOGGER_TOKEN);

export const USER_MANAGEMENT_OPERATOR_TOKEN = token<UserManagementOperator>("UserManagementOperator");