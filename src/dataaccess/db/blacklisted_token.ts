import { Knex } from "knex";
import { Logger } from "winston";
import { ErrorWithHTTPCode, LOGGER_TOKEN } from "../../utils";
import { injected, token } from "brandi";
import { KNEX_INSTANCE_TOKEN } from "./knex";
import httpStatus from "http-status";

const TabNameBlacklistedToken = "blacklisted_token";
const ColNameBlacklistedTokenId = "token_id";
const ColNameBlacklistedTokenExpireAt = "expire_at";

export interface BlacklistedTokenDataAccessor {
    createBlacklistedToken(tokenId: number, expireAt: number): Promise<void>;
    deleteExpiredBlacklistedToken(requestTime: number): Promise<number>;
    getBlacklistedTokenExpireAt(tokenId: number): Promise<number | null>;
    getBlacklistedTokenExpireAtWithXLock(tokenId: number): Promise<number | null>;
    withTransaction<T>(cb: (dataAccessor: BlacklistedTokenDataAccessor) => Promise<T>): Promise<T>;
}

export class BlacklistedTokenDataAccessorImpl implements BlacklistedTokenDataAccessor {
    constructor(private readonly knex: Knex<any, any[]>, private readonly logger: Logger) { }

    public async createBlacklistedToken(tokenId: number, expireAt: number): Promise<void> {
        try {
            await this.knex
                .insert({
                    [ColNameBlacklistedTokenId]: tokenId,
                    [ColNameBlacklistedTokenExpireAt]: expireAt,
                })
                .into(TabNameBlacklistedToken);
        } catch (error) {
            this.logger.error("fail to create blacklisted token", { tokenId, expireAt, error });
            throw new ErrorWithHTTPCode("fail to create blacklisted token", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async deleteExpiredBlacklistedToken(requestTime: number): Promise<number> {
        try {
            const deleteCount = await this.knex
                .delete()
                .from(TabNameBlacklistedToken)
                .where(ColNameBlacklistedTokenExpireAt, "<=", requestTime);
            return deleteCount;
        } catch (error) {
            this.logger.error("fail to delete expired blacklisted token", { requestTime, error });
            throw new ErrorWithHTTPCode("fail to delete expired blacklisted token", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async getBlacklistedTokenExpireAt(tokenId: number): Promise<number | null> {
        try {
            const rows = await this.knex
                .select([ColNameBlacklistedTokenExpireAt])
                .from(TabNameBlacklistedToken)
                .where(ColNameBlacklistedTokenId, "=", tokenId);
            if (rows.length !== 1) {
                return null;
            }
            return +rows[0][ColNameBlacklistedTokenExpireAt];
        } catch (error) {
            this.logger.error("fail to get blacklisted token expired", { tokenId, error });
            throw new ErrorWithHTTPCode("fail to get blacklisted token expired", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async getBlacklistedTokenExpireAtWithXLock(tokenId: number): Promise<number | null> {
        try {
            const rows = await this.knex
                .select([ColNameBlacklistedTokenExpireAt])
                .from(TabNameBlacklistedToken)
                .where(ColNameBlacklistedTokenId, "=", tokenId)
                .forUpdate();
            if (rows.length !== 1) {
                return null;
            }
            return +rows[0][ColNameBlacklistedTokenExpireAt];
        } catch (error) {
            this.logger.error("fail to get blacklisted token expired", { tokenId, error });
            throw new ErrorWithHTTPCode("fail to get blacklisted token expired", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async withTransaction<T>(cb: (dataAccessor: BlacklistedTokenDataAccessor) => Promise<T>): Promise<T> {
        return this.knex.transaction(async (trx) => {
            const trxDataAccessor = new BlacklistedTokenDataAccessorImpl(trx, this.logger);
            return cb(trxDataAccessor);
        });
    }
}

injected(BlacklistedTokenDataAccessorImpl, KNEX_INSTANCE_TOKEN, LOGGER_TOKEN);

export const BLACKLISTED_TOKEN_DATA_ACCESSOR_TOKEN = token<BlacklistedTokenDataAccessor>("BlacklistedTokenDataAccessor");