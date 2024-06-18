import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Redis } from "ioredis";
import { Logger, error } from "winston";
import { CACHE_CONFIG_TOKEN, CacheConfig } from "../../config";
import { ErrorWithHTTPCode, LOGGER_TOKEN } from "../../utils";

export interface CacheClient {
    set(key: string, value: string, ttlInSecond: number): Promise<void>;
    get(key: string): Promise<any>;
    addToSet(key: string, data: any): Promise<void>;
    isDataInSet(key: string, data: any): Promise<boolean>;
}

export class RedisClient implements CacheClient {
    private readonly redisClient;

    constructor(
        private readonly logger: Logger,
        private readonly cacheConfig: CacheConfig
    ) {
        this.redisClient = new Redis({
            host: this.cacheConfig.host,
            port: this.cacheConfig.port,
            username: this.cacheConfig.username,
            password: this.cacheConfig.password,
        });
    }

    public async addToSet(key: string, data: any): Promise<void> {
        try {
            await this.redisClient.sadd(key, data);
        } catch {
            this.logger.error("failed to set data into set inside cache");
            throw new ErrorWithHTTPCode("failed to set data into set inside cache", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async isDataInSet(key: string, data: any): Promise<boolean> {
        const result = await this.redisClient.sismember(key, data);

        if (result === 0) {
            this.logger.error("no value found", { key });
            throw new ErrorWithHTTPCode("no value found", httpStatus.INTERNAL_SERVER_ERROR);
        }

        return true;
    }

    public async get(key: string): Promise<any> {
        const value = await this.redisClient.get(key);
        if (value === null) {
            this.logger.error("no value found", { key, value });
            throw new ErrorWithHTTPCode("no value found", httpStatus.INTERNAL_SERVER_ERROR);
        }

        return value;
    }

    public async set(key: string, value: string, ttlInSecond: number): Promise<void> {
        try {
            await this.redisClient.set(key, value);
        } catch (error) {
            console.log(error);
            this.logger.error("failed to store value into key", { key, error });
            throw new ErrorWithHTTPCode("failed to store value into key", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

injected(RedisClient, LOGGER_TOKEN, CACHE_CONFIG_TOKEN);

export const REDIS_CLIENT_TOKEN = token<RedisClient>("RedisClient");