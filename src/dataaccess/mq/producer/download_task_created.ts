import { Producer } from "kafkajs";
import { Logger } from "winston";
import { BINARY_CONVERTER_TOKEN, BinaryConverter, ErrorWithHTTPCode, LOGGER_TOKEN } from "../../../utils";
import { injected, token } from "brandi";
import { KAFKA_PRODUCER_TOKEN } from "./producer";
import httpStatus from "http-status";

export class DownloadTaskCreated {
    constructor(
        public id: number
    ) { }
}

export interface DownloadTaskCreatedProducer {
    createDownloadTaskCreatedMessage(message: DownloadTaskCreated): Promise<void>;
}

const TopicNameDownloadTaskCreated = "download_task_created";

export class DownloadTaskCreatedProducerImpl implements DownloadTaskCreatedProducer {
    constructor(
        private readonly producer: Producer,
        private readonly binaryConverter: BinaryConverter,
        private readonly logger: Logger
    ) { }

    public async createDownloadTaskCreatedMessage(message: DownloadTaskCreated): Promise<void> {
        try {
            await this.producer.connect();
            await this.producer.send({
                topic: TopicNameDownloadTaskCreated,
                messages: [{ value: this.binaryConverter.toBuffer(message) }],
            });
        } catch (error) {
            this.logger.error(
                `failed to create ${TopicNameDownloadTaskCreated} message`,
                { message, error }
            );
            throw new ErrorWithHTTPCode("failed to create download task message", httpStatus.BAD_REQUEST);
        }
    }
}

injected(
    DownloadTaskCreatedProducerImpl,
    KAFKA_PRODUCER_TOKEN,
    BINARY_CONVERTER_TOKEN,
    LOGGER_TOKEN
);

export const DOWNLOAD_TASK_CREATED_PRODUCER_TOKEN = token<DownloadTaskCreatedProducer>("DownloadTaskCreatedProducer");

