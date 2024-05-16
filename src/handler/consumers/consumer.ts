
import { injected, token } from "brandi";
import { Logger } from "winston";
import { MESSAGE_CONSUMER_TOKEN, MessageConsumer } from "../../dataaccess/mq";
import { BINARY_CONVERTER_TOKEN, BinaryConverter, LOGGER_TOKEN } from "../../utils";
import { DOWNLOAD_TASK_CREATED_MESSAGE_HANDLER_TOKEN, DownloadTaskCreatedMessageHandler } from "./download_task_created";

const TopicNameDownloadTaskCreated = "download_task_created";

export class MQConsumer {
    constructor(
        private readonly messageConsumer: MessageConsumer,
        private readonly downloadTaskCreatedMessageHandler: DownloadTaskCreatedMessageHandler,
        private readonly binaryConverter: BinaryConverter,
        private readonly logger: Logger
    ) { }

    public start(): void {
        this.messageConsumer
            .registerHandlerListAndStart([
                {
                    topic: TopicNameDownloadTaskCreated,
                    onMessage: (message) =>
                        this.onDownloadTaskCreated(message),
                },
            ])
            .then(() => {
                if (process.send) {
                    process.send("ready");
                }
            });
    }

    private async onDownloadTaskCreated(message: Buffer | null): Promise<void> {
        if (message === null) {
            this.logger.error("null message, skipping");
            return;
        }
        const downloadTaskCreatedMessage = this.binaryConverter.fromBuffer(message);
        await this.downloadTaskCreatedMessageHandler.onDownloadTaskCreated(
            downloadTaskCreatedMessage
        );
    }
}

injected(
    MQConsumer,
    MESSAGE_CONSUMER_TOKEN,
    DOWNLOAD_TASK_CREATED_MESSAGE_HANDLER_TOKEN,
    BINARY_CONVERTER_TOKEN,
    LOGGER_TOKEN
);

export const MQ_CONSUMER_TOKEN =
    token<MQConsumer>("MQConsumer");