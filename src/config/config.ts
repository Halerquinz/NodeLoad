import { token } from "brandi";
import { LogConfig, } from "./log";
import { DatabaseConfig } from "./database";
import { DownloadConfig } from "./download";
import { CacheConfig } from "./cache";
import { TokenConfig } from "./token";
import { DistributedConfig } from "./distributed";
import { HTTPServer } from "../handler/http";
import { HTTPServerConfig } from "./http_server";

export class ServerConfig {
    public logConfig = new LogConfig();
    public databaseConfig = new DatabaseConfig();
    public downloadConfig = new DownloadConfig();
    public cacheConfig = new CacheConfig();
    public tokenConfig = new TokenConfig();
    public distributedConfig = new DistributedConfig();
    public httpServerConfig = new HTTPServerConfig();

    public static fromEnv(): ServerConfig {
        const config = new ServerConfig();
        config.logConfig = LogConfig.fromEnv();
        config.databaseConfig = DatabaseConfig.fromEnv();
        config.downloadConfig = DownloadConfig.fromEnv();
        config.cacheConfig = CacheConfig.fromEnv();
        config.tokenConfig = TokenConfig.fromEnv();
        config.distributedConfig = DistributedConfig.fromEnv();
        config.httpServerConfig = HTTPServerConfig.fromEnv();
        return config;
    }
}

export const SERVER_CONFIG_TOKEN = token<ServerConfig>("ServerConfig");