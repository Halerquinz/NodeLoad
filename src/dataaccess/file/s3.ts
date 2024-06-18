import { injected, token } from "brandi";
import { Client } from "minio";
import { DOWNLOAD_CONFIG_TOKEN, DownloadConfig } from "../../config";

export function newS3Client(downloadConfig: DownloadConfig): Client {
    return new Client({
        endPoint: downloadConfig.host,
        port: downloadConfig.port,
        accessKey: downloadConfig.username,
        secretKey: downloadConfig.password,
        useSSL: false,
    });
}

injected(newS3Client, DOWNLOAD_CONFIG_TOKEN);

export const S3_CLIENT_TOKEN = token<Client>("Client");
