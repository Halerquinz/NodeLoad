import { injected, token } from "brandi";
import { CacheClient, REDIS_CLIENT_TOKEN } from "./client";

export interface TokenPublicKeyCacheDM {
    set(keyID: number, data: string): Promise<void>;
    get(keyID: number): Promise<string>;
}

export class TokenPublicKeyCacheDMImpl implements TokenPublicKeyCacheDM {
    constructor(private readonly client: CacheClient) { }

    public async set(keyID: number, data: string): Promise<void> {
        return this.client.set(this.getKey(keyID), data, 0);
    }

    public async get(keyID: number): Promise<string> {
        return (await this.client.get(this.getKey(keyID))) as string;
    }

    private getKey(keyID: number): string {
        return `token_public_key|key_id:${keyID}`;
    }
}

injected(TokenPublicKeyCacheDMImpl, REDIS_CLIENT_TOKEN);

export const TOKEN_PUBLIC_KEY_CACHE_DM_TOKEN = token<TokenPublicKeyCacheDM>("TokenPublicKeyCacheDM");
