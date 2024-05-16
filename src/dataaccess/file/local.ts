import { injected, token } from "brandi";
import { FileClient } from "./client";
import fs from "fs";
import path from "path";
import { Logger } from "winston";
import { DOWNLOAD_CONFIG_TOKEN, DownloadConfig } from "../../config";
import { LOGGER_TOKEN } from "../../utils";

export class LocalClient implements FileClient {
    private readonly downloadDirectory: string;

    constructor(
        private readonly logger: Logger,
        private readonly downloadConfig: DownloadConfig

    ) {
        this.downloadDirectory = this.downloadConfig.downloadDirectory;
        if (!fs.existsSync(this.downloadDirectory)) {
            fs.mkdirSync(this.downloadDirectory, { recursive: true });
        }
    }

    public read(filePath: string): fs.ReadStream {
        const absolutePath = path.join(this.downloadDirectory, filePath);
        try {
            const fileStream = fs.createReadStream(absolutePath);
            return fileStream;
        } catch (error) {
            this.logger.error("failed to open file", { error, filePath: absolutePath });
            throw new Error('failed to open file');
        }
    }

    public write(filePath: string): fs.WriteStream {
        const absolutePath = path.join(this.downloadDirectory, filePath);
        try {
            const fileStream = fs.createWriteStream(absolutePath);
            return fileStream;
        } catch (error) {
            this.logger.error("failed to open file", { error, filePath: absolutePath });
            throw new Error("failed to open file");
        }
    }
}

injected(LocalClient, LOGGER_TOKEN, DOWNLOAD_CONFIG_TOKEN);

export const LOCAL_CLIENT_TOKEN = token<LocalClient>("LocalClient");