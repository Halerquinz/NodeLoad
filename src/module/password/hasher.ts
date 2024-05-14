import bcrypt from "bcrypt";
import { injected, token } from "brandi";
import { Logger } from "winston";
import { ErrorWithHTTPCode, LOGGER_TOKEN } from "../../utils";
import httpStatus from "http-status";

export interface Hasher {
    hash(s: string): Promise<string>;
    isEqual(s: string, hash: string): Promise<boolean>;
}

const SALT_ROUND = 10;

export class BcryptHasher implements Hasher {
    constructor(private readonly logger: Logger) { }

    public async hash(s: string): Promise<string> {
        try {
            return await bcrypt.hash(s, SALT_ROUND);
        } catch (error) {
            this.logger.error("failed to generate hash", { error });
            throw ErrorWithHTTPCode.wrapWithStatus(error, httpStatus.BAD_REQUEST);
        }
    }

    public async isEqual(s: string, hash: string): Promise<boolean> {
        try {
            return await bcrypt.compare(s, hash);
        } catch (error) {
            this.logger.error("failed to compare string with hash", { error });
            throw ErrorWithHTTPCode.wrapWithStatus(error, httpStatus.BAD_REQUEST);
        }
    }
}

injected(BcryptHasher, LOGGER_TOKEN);

export const HASHER_TOKEN = token<Hasher>("Hasher");
