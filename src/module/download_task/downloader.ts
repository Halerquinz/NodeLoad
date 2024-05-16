import axios from "axios";
import fs from "fs";
import { Logger } from "winston";

const HTTPResponseHeaderContentType = "Content-Type";
const HTTPMetadataKeyContentType = "content-type";

export interface Downloader {
    download(writer: fs.WriteStream): Promise<Map<string, any>>;
}

export class HTTPDownloader implements Downloader {
    constructor(
        private readonly url: string,
        private readonly logger: Logger,
    ) { }

    public async download(writer: fs.WriteStream): Promise<Map<string, any>> {
        try {
            const response = await axios({
                method: "get",
                url: this.url,
                responseType: "stream"
            });

            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on("finish", () => {
                    this.logger.info("file downloaded successfully");
                    resolve(new Map<string, any>([
                        [HTTPResponseHeaderContentType, response.headers[HTTPMetadataKeyContentType]]
                    ]));
                });

                writer.on("error", (error) => {
                    this.logger.error("failed to write the file", error);
                    reject(error);
                });
            });
        } catch (error) {
            this.logger.error("failed to download:", error);
            throw error;
        }
    }
}


