import { token } from "brandi";

export class CacheConfig {
    public address = "127.0.0.1:6379";
    public username = "";
    public password = ""

    public static fromEnv(): CacheConfig {
        const config = new CacheConfig();
        if (process.env.CACHE_ADDRESS !== undefined) {
            config.address = process.env.CACHE_ADDRESS;
        }
        if (process.env.CACHE_USERNAME !== undefined) {
            config.username = process.env.CACHE_USERNAME;
        }
        if (process.env.CACHE_PASSWORD !== undefined) {
            config.password = process.env.CACHE_PASSWORD;
        }
        return config;
    }
}

export const CACHE_CONFIG_TOKEN = token<CacheConfig>("CacheConfig");
