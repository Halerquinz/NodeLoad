import { injected, token } from "brandi";
import { CacheClient, REDIS_CLIENT_TOKEN } from "./client";

const SetKeyNameTakenUsername = "taken_user_name_set";

export interface TakenUsernameCacheDM {
    add(username: string): Promise<void>;
    has(username: string): Promise<boolean>;
}

export class TakenUsernameCacheDMImpl implements TakenUsernameCacheDM {
    constructor(
        private readonly client: CacheClient,
    ) { }

    public async add(username: string): Promise<void> {
        return this.client.addToSet(SetKeyNameTakenUsername, username);
    }

    public async has(username: string): Promise<boolean> {
        return this.client.isDataInSet(SetKeyNameTakenUsername, username);
    }
}

injected(TakenUsernameCacheDMImpl, REDIS_CLIENT_TOKEN);

export const TAKEN_USER_NAME_CACHE_DM_TOKEN = token<TakenUsernameCacheDM>("TakenUsernameCacheDM");
