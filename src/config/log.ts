import { token } from "brandi";

export class LogConfig {
    public logDir = "logs";
    public maxFiles = 24 * 7;

    public static fromEnv(): LogConfig {
        const config = new LogConfig();
        if (process.env.SERVER_LOG_DIR !== undefined) {
            config.logDir = process.env.SERVER_LOG_DIR;
        }
        if (process.env.SERVER_LOG_MAX_FILES !== undefined) {
            config.maxFiles = +process.env.SERVER_LOG_MAX_FILES;
        }
        return config;
    }
}

export const LOG_CONFIG_TOKEN = token<LogConfig>("LogConfig");