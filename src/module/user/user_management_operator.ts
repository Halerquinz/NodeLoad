import { injected, token } from "brandi";
import httpStatus from "http-status";
import validator from "validator";
import { Logger } from "winston";
import { USER_DATA_ACCESSOR_TOKEN, User, UserDataAccessor } from "../../dataaccess/db";
import { ErrorWithHTTPCode } from "../../utils";
import { LOGGER_TOKEN } from "../../utils/logging";

export interface UserManagementOperator {
    createUser(username: string, displayName: string): Promise<User>;
    updateUser(user: User): Promise<User>;
    getUser(userId: number): Promise<User>;
}

export class UserManagementOperatorImpl implements UserManagementOperator {
    constructor(
        private readonly userDM: UserDataAccessor,
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

        return this.userDM.withTransaction<User>(async (dm) => {
            const userRecord = await dm.getUserByUsernameWithXLock(username);
            if (userRecord !== null) {
                this.logger.error("username has already been taken", {
                    username,
                });
                throw new ErrorWithHTTPCode("username ${username} has already been taken", httpStatus.CONFLICT);
            }

            const createUserId = await dm.createUser(username, displayName);
            return {
                id: createUserId,
                username,
                displayName
            }
        })
    }

    public async updateUser(user: User): Promise<User> {
        if (user.id === undefined) {
            this.logger.error("userId is requirement");
            throw new ErrorWithHTTPCode("userId is requirement", httpStatus.BAD_REQUEST);
        }

        if (user.username !== undefined) {
            if (!this.isValidUsername(user.username)) {
                this.logger.error("invalid username");
                throw new ErrorWithHTTPCode("invalid username", httpStatus.BAD_REQUEST);
            }
        }

        if (user.displayName !== undefined) {
            if (!this.isValidDisplayName(user.displayName)) {
                this.logger.error("invalid displayName");
                throw new ErrorWithHTTPCode("invalid displayName", httpStatus.BAD_REQUEST);
            }
        }

        return this.userDM.withTransaction<User>(async (userDM) => {
            const userRecord = await userDM.getUserByUserIdWithXLock(user.id);
            if (userRecord === null) {
                this.logger.error("can not find user with userId");
                throw new ErrorWithHTTPCode("can not find user with userId", httpStatus.BAD_REQUEST);
            }

            if (user.username !== undefined) {
                const userWithUsernameRecord = await userDM.getUserByUsernameWithXLock(user.username);
                if (userWithUsernameRecord !== null && userWithUsernameRecord.id !== user.id) {
                    this.logger.error("username already exist");
                    throw new ErrorWithHTTPCode("username already exist", httpStatus.CONFLICT);
                }

                userRecord.username = user.username;
            }

            await userDM.updateUser(user);

            if (user.displayName !== undefined) {
                userRecord.displayName = user.displayName;
            }

            return userRecord;
        })
    }

    public async getUser(userId: number): Promise<User> {
        const user = await this.userDM.getUserByUserId(userId);
        if (user === null) {
            this.logger.error("can not find user with userId");
            throw new ErrorWithHTTPCode("can not find user with userId", httpStatus.BAD_REQUEST);
        }

        return user;
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

injected(UserManagementOperatorImpl, USER_DATA_ACCESSOR_TOKEN, LOGGER_TOKEN);

export const USER_MANAGEMENT_OPERATOR_TOKEN = token<UserManagementOperator>("UserManagementOperator");