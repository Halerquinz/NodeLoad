import { token } from "brandi";
import { CacheConfig } from "./cache";
import { CronConfig } from "./cron";
import { DatabaseConfig } from "./database";
import { DistributedConfig } from "./distributed";
import { DownloadConfig } from "./download";
import { HTTPServerConfig } from "./http_server";
import { LogConfig, } from "./log";
import { MQConfig } from "./mq";
import { TokenConfig } from "./token";
import { RedisConfig } from "./redis";

export class ServerConfig {
    public logConfig = new LogConfig();
    public databaseConfig = new DatabaseConfig();
    public downloadConfig = new DownloadConfig();
    public cacheConfig = new CacheConfig();
    public tokenConfig = new TokenConfig();
    public distributedConfig = new DistributedConfig();
    public httpServerConfig = new HTTPServerConfig();
    public mqConfig = new MQConfig();
    public cronConfig = new CronConfig();
    public redisConfig = new RedisConfig();

    public static fromEnv(): ServerConfig {
        const config = new ServerConfig();
        config.logConfig = LogConfig.fromEnv();
        config.databaseConfig = DatabaseConfig.fromEnv();
        config.downloadConfig = DownloadConfig.fromEnv();
        config.cacheConfig = CacheConfig.fromEnv();
        config.tokenConfig = TokenConfig.fromEnv();
        config.distributedConfig = DistributedConfig.fromEnv();
        config.httpServerConfig = HTTPServerConfig.fromEnv();
        config.mqConfig = MQConfig.fromEnv();
        config.cronConfig = CronConfig.fromEnv();
        config.redisConfig = RedisConfig.fromEnv();
        return config;
    }
}

export const SERVER_CONFIG_TOKEN = token<ServerConfig>("ServerConfig");