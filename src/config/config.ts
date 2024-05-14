import { token } from "brandi";
import { LogConfig, } from "./log";
import { DatabaseConfig } from "./database";
import { DownloadConfig } from "./download";
import { CacheConfig } from "./cache";
import { TokenConfig } from "./token";
import { DistributedConfig } from "./distributed";

export class ServerConfig {
    public logConfig = new LogConfig();
    public databaseConfig = new DatabaseConfig();
    public downloadConfig = new DownloadConfig();
    public cacheConfig = new CacheConfig();
    public tokenConfig = new TokenConfig();
    public distributedConfig = new DistributedConfig();

    public static fromEnv(): ServerConfig {
        const config = new ServerConfig();
        config.logConfig = LogConfig.fromEnv();
        config.databaseConfig = DatabaseConfig.fromEnv();
        config.downloadConfig = DownloadConfig.fromEnv();
        config.cacheConfig = CacheConfig.fromEnv();
        config.tokenConfig = TokenConfig.fromEnv();
        config.distributedConfig = DistributedConfig.fromEnv();
        return config;
    }
}

export const SERVER_CONFIG_TOKEN = token<ServerConfig>("ServerConfig");