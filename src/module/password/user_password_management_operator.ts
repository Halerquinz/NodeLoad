import { injected, token } from "brandi";
import validator from "validator";
import { Logger } from "winston";
import { USER_DATA_ACCESSOR_TOKEN, USER_PASSWORD_DATA_ACCESSOR_TOKEN, User, UserDataAccessor, UserPasswordDataAccessor } from "../../dataaccess/db";
import { ErrorWithHTTPCode, LOGGER_TOKEN } from "../../utils";
import { TOKEN_GENERATOR_TOKEN, TokenGenerator } from "../token";
import { HASHER_TOKEN, Hasher } from "./hasher";
import httpStatus from "http-status";

export interface UserPasswordManagementOperator {
    createUserPassword(userId: number, password: string): Promise<void>;
    updateUserPassword(userId: number, password: string): Promise<void>;
    loginWithPassword(username: string, password: string): Promise<{ user: User; token: string }>;
}

export class UserPasswordManagementOperatorImpl implements UserPasswordManagementOperator {

    constructor(
        private readonly userDM: UserDataAccessor,
        private readonly userPasswordDM: UserPasswordDataAccessor,
        private readonly tokenGenerator: TokenGenerator,
        private readonly logger: Logger,
        private readonly hasher: Hasher,
    ) { }

    public async createUserPassword(ofUserId: number, password: string): Promise<void> {
        if (!this.isValidPassword(password)) {
            this.logger.error("invalid password");
            throw new ErrorWithHTTPCode(
                `invalid password`,
                httpStatus.BAD_REQUEST
            );
        }

        const user = await this.userDM.getUserByUserId(ofUserId);
        if (user === null) {
            this.logger.error("no user with user_id found", {
                userId: ofUserId,
            });
            throw new ErrorWithHTTPCode(
                `no user with with id ${ofUserId} found`,
                httpStatus.NOT_FOUND
            );
        }

        const hash = await this.hasher.hash(password);
        return this.userPasswordDM.withTransaction(async (dm) => {
            const oldHash = await dm.getUserPasswordHashWithXLock(ofUserId);
            if (oldHash !== null) {
                this.logger.error("user with user_id already has a password", {
                    userId: ofUserId,
                });
                throw new ErrorWithHTTPCode(
                    `user with id ${ofUserId} already has a password`,
                    httpStatus.CONFLICT
                );
            }

            await dm.createUserPassword(ofUserId, hash);
        });
    }

    public async updateUserPassword(ofUserId: number, password: string): Promise<void> {
        if (!this.isValidPassword(password)) {
            this.logger.error("invalid password");
            throw new ErrorWithHTTPCode(
                `invalid password`,
                httpStatus.BAD_REQUEST
            );
        }

        const user = await this.userDM.getUserByUserId(ofUserId);
        if (user === null) {
            this.logger.error("no user with user_id found", {
                userId: ofUserId,
            });
            throw new ErrorWithHTTPCode(
                `no user with with id ${ofUserId} found`,
                httpStatus.NOT_FOUND
            );
        }

        const hash = await this.hasher.hash(password);
        return this.userPasswordDM.withTransaction(async (dm) => {
            const oldHash = await dm.getUserPasswordHashWithXLock(ofUserId);
            if (oldHash === null) {
                this.logger.error(
                    "user with user_id does not have a password",
                    { userId: ofUserId }
                );
                throw new ErrorWithHTTPCode(
                    `user with id ${ofUserId} does not have a password`,
                    httpStatus.NOT_FOUND
                );
            }

            await dm.updateUserPassword(ofUserId, hash);
        });
    }

    public async loginWithPassword(username: string, password: string): Promise<{ user: User; token: string }> {
        const user = await this.userDM.getUserByUsername(username);
        if (user === null) {
            this.logger.error("no user with username found", { username });
            throw new ErrorWithHTTPCode(`no user with username ${username} found`, httpStatus.NOT_FOUND);
        }

        const hash = await this.userPasswordDM.getUserPasswordHash(user.id);
        if (hash === null) {
            this.logger.error("user doesn't have password", { userId: user.id, });
            throw new ErrorWithHTTPCode("user doesn't have password", httpStatus.NOT_FOUND);
        }

        if (!(await this.hasher.isEqual(password, hash))) {
            this.logger.error("incorrect password", { userId: user.id, });
            throw new ErrorWithHTTPCode("incorrect password", httpStatus.UNAUTHORIZED);
        }

        const token = await this.tokenGenerator.generate(user.id);
        return { user, token };
    }

    private isValidPassword(password: string): boolean {
        return validator.isLength(password, { min: 4 });
    }
}

injected(
    UserPasswordManagementOperatorImpl,
    USER_DATA_ACCESSOR_TOKEN,
    USER_PASSWORD_DATA_ACCESSOR_TOKEN,
    TOKEN_GENERATOR_TOKEN,
    LOGGER_TOKEN, HASHER_TOKEN
);

export const USER_PASSWORD_MANAGEMENT_OPERATOR_TOKEN = token<UserPasswordManagementOperator>("UserPasswordManagementOperator");
