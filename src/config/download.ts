import { token } from "brandi";

export class DownloadConfig {
    public mode = "s3";
    public downloadDirectory = "../downloads";
    public bucket = "download_files";
    public address = "127.0.0.1:9000";
    public username = "ROOTUSER";
    public password = "CHANME123";

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