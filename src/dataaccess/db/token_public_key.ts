import { Knex } from "knex";
import { Logger } from "winston";
import { ErrorWithHTTPCode, LOGGER_TOKEN } from "../../utils";
import { injected, token } from "brandi";
import { KNEX_INSTANCE_TOKEN } from "./knex";
import httpStatus from "http-status";

export class TokenPublicKey {
    constructor(public id: number, public data: string) { }
}

export interface TokenPublicKeyDataAccessor {
    createTokenPublicKey(data: string): Promise<number>;
    getTokenPublicKey(id: number): Promise<TokenPublicKey | null>;
}

const TabNameTokenPublicKey = "token_public_key";
const ColNameTokenPublicKeyId = "public_key_id";
const ColNameTokenPublicKeyData = "data";

export class TokenPublicKeyDataAccessorImpl implements TokenPublicKeyDataAccessor {
    constructor(private readonly knex: Knex<any, any[]>, private readonly logger: Logger) { }

    public async createTokenPublicKey(data: string): Promise<number> {
        try {
            const rows = await this.knex
                .insert({ [ColNameTokenPublicKeyData]: data })
                .into(TabNameTokenPublicKey);
            return +rows[0];
        } catch (error) {
            this.logger.error("failed to create token public key", { error });
            throw new ErrorWithHTTPCode("failed to create token public key", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async getTokenPublicKey(id: number): Promise<TokenPublicKey | null> {
        let rows: Record<string, any>[];
        try {
            rows = await this.knex
                .select(ColNameTokenPublicKeyData)
                .from(TabNameTokenPublicKey)
                .where({ [ColNameTokenPublicKeyId]: id });
        } catch (error) {
            this.logger.error("failed to get token public key by id", { id, error });
            throw new ErrorWithHTTPCode("failed to get token public key by id", httpStatus.INTERNAL_SERVER_ERROR);
        }

        if (rows.length == 0) {
            this.logger.debug("no token public key with id found", { id });
            return null;
        }

        if (rows.length > 1) {
            this.logger.error("more than one token public key with id found", { id });
            throw new ErrorWithHTTPCode("more than one token public key with id found", httpStatus.INTERNAL_SERVER_ERROR);
        }

        return this.getTokenPublicKeyFromRow(rows[0]);
    }

    private getTokenPublicKeyFromRow(row: Record<string, any>): TokenPublicKey {
        return new TokenPublicKey(+row[ColNameTokenPublicKeyId], row[ColNameTokenPublicKeyData]);
    }
}

injected(TokenPublicKeyDataAccessorImpl, KNEX_INSTANCE_TOKEN, LOGGER_TOKEN);

export const TOKEN_PUBLIC_KEY_DATA_ACCESSOR_TOKEN = token<TokenPublicKeyDataAccessor>("TokenPublicKeyDataAccessor");