import axios from "axios";
import fs from "fs";
import { Client } from "minio";
import { Logger } from "winston";
import { DownloadConfig } from "../../config";

const HTTPResponseHeaderContentType = "Content-Type";
const HTTPMetadataKeyContentType = "content-type";

export interface Downloader {
    downloadLocal(writer: fs.WriteStream): Promise<Map<string, any> | null>;
    downloadS3(fileName: string): Promise<Map<string, any> | null>;
}

export class HTTPDownloader implements Downloader {
    constructor(
        private readonly url: string,
        private readonly logger: Logger,
        private readonly minioClient: Client,
        private readonly downloadConfig: DownloadConfig
    ) { }

    public async downloadS3(fileName: string): Promise<Map<string, any> | null> {
        try {
            const response = await axios({
                method: "get",
                url: this.url,
                responseType: "stream"
            });

            if (response.status !== 200) {
                return null;
            }

            const contentType = response.headers["content-type"];
            const metaData = {
                "Content-Type": contentType
            };

            await this.minioClient.putObject(this.downloadConfig.bucket, fileName, response.data, metaData);
            return new Map<string, any>([
                [HTTPResponseHeaderContentType, response.headers[HTTPMetadataKeyContentType]]
            ]);
        } catch (error) {
            this.logger.error("failed to download with mode s3", { error });
            return null;
        }
    }

    public async downloadLocal(writer: fs.WriteStream): Promise<Map<string, any> | null> {
        try {
            const response = await axios({
                method: "get",
                url: this.url,
                responseType: "stream"
            });

            if (response.status !== 200) {
                this.logger.error("failed to download with mode local");
                return null;
            }

            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on("finish", () => {
                    resolve(new Map<string, any>([
                        [HTTPResponseHeaderContentType, response.headers[HTTPMetadataKeyContentType]]
                    ]));
                });

                writer.on("error", (error) => {
                    this.logger.error("failed to write the file", { error: error.message });
                    writer.end(); // Ensure the stream is properly closed in case of error
                    reject(error);
                });
            });
        } catch (error) {
            this.logger.error("failed to download with mode local", { error });
            return null;
        }
    }
}


