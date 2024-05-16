import { DOWNLOAD_CONFIG_TOKEN, DownloadConfig } from "../../config";
import fs from "fs";
import { LocalClient } from "./local";
import { Logger } from "winston";
import { injected, token } from "brandi";
import { LOGGER_TOKEN } from "../../utils";

export interface FileClient {
    write(filePath: string): fs.WriteStream;
    read(filePath: string): fs.ReadStream;
}

export function newClient(downloadConfig: DownloadConfig, logger: Logger): FileClient {
    return new LocalClient(logger, downloadConfig);
}

injected(newClient, DOWNLOAD_CONFIG_TOKEN, LOGGER_TOKEN);

export const FILE_CLIENT_TOKEN = token<FileClient>("FileClient");


































































































