import { Container } from "brandi";
import { SERVER_CONFIG_TOKEN, ServerConfig } from "./config";
import { LOG_CONFIG_TOKEN } from "./log";
import { DATABASE_CONFIG_TOKEN } from "./database";
import { DOWNLOAD_CONFIG_TOKEN } from "./download";
import { CACHE_CONFIG_TOKEN } from "./cache";

export * from "./config";
export * from "./log";
export * from "./database";
export * from "./cache";
export * from "./download";

export function bindToContainer(container: Container): void {
    container.bind(SERVER_CONFIG_TOKEN).toInstance(ServerConfig.fromEnv).inSingletonScope();
    container
        .bind(LOG_CONFIG_TOKEN)
        .toInstance(() => container.get(SERVER_CONFIG_TOKEN).logConfig)
        .inSingletonScope();
    container
        .bind(DATABASE_CONFIG_TOKEN)
        .toInstance(() => container.get(SERVER_CONFIG_TOKEN).databaseConfig)
        .inSingletonScope();
    container
        .bind(DOWNLOAD_CONFIG_TOKEN)
        .toInstance(() => container.get(SERVER_CONFIG_TOKEN).downloadConfig)
        .inSingletonScope();
    container
        .bind(CACHE_CONFIG_TOKEN)
        .toInstance(() => container.get(SERVER_CONFIG_TOKEN).cacheConfig)
        .inSingletonScope();
}