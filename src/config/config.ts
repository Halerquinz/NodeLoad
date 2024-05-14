import { token } from "brandi";
import { LogConfig, } from "./log";
import { DatabaseConfig } from "./database";
import { DownloadConfig } from "./download";
import { CacheConfig } from "./cache";

export class ServerConfig {
    public logConfig = new LogConfig();
    public databaseConfig = new DatabaseConfig();
    public downloadConfig = new DownloadConfig();
    public cacheConfig = new CacheConfig();

    public static fromEnv(): ServerConfig {
        const config = new ServerConfig();
        config.logConfig = LogConfig.fromEnv();
        config.databaseConfig = DatabaseConfig.fromEnv();
        config.downloadConfig = DownloadConfig.fromEnv();
        config.cacheConfig = CacheConfig.fromEnv();
        return config;
    }
}

export const SERVER_CONFIG_TOKEN = token<ServerConfig>("ServerConfig");