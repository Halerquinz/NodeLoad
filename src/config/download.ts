import { token } from "brandi";

export class DownloadConfig {
    public mode = "s3";
    public downloadDirectory = "../downloads";
    public bucket = "download-files";
    public address = "127.0.0.1:9000";
    public host = "127.0.0.1";
    public port = 9000;
    public username = "ROOTUSER";
    public password = "CHANGEME123";

    public static fromEnv(): DownloadConfig {
        const config = new DownloadConfig();
        if (process.env.DOWNLOAD_MODE !== undefined) {
            config.mode = process.env.DOWNLOAD_MODE;
        }
        if (process.env.DOWNLOAD_DIRECTORY !== undefined) {
            config.downloadDirectory = process.env.DOWNLOAD_DIRECTORY;
        }
        if (process.env.DOWNLOAD_BUCKET !== undefined) {
            config.bucket = process.env.DOWNLOAD_BUCKET;
        }
        if (process.env.DOWNLOAD_ADDRESS !== undefined) {
            config.address = process.env.DOWNLOAD_ADDRESS;
        }
        if (process.env.DOWNLOAD_HOST !== undefined) {
            config.host = process.env.DOWNLOAD_HOST;
        }
        if (process.env.DOWNLOAD_PORT !== undefined) {
            config.port = +process.env.DOWNLOAD_PORT;
        }
        if (process.env.DOWNLOAD_USERNAME !== undefined) {
            config.username = process.env.DOWNLOAD_USERNAME;
        }
        if (process.env.DOWNLOAD_PASSWORD !== undefined) {
            config.password = process.env.DOWNLOAD_PASSWORD;
        }
        return config;
    }
}

export const DOWNLOAD_CONFIG_TOKEN = token<DownloadConfig>("DownloadConfig");