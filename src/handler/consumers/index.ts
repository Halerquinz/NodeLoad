import { Container } from "brandi";
import { MQConsumer, MQ_CONSUMER_TOKEN } from "./consumer";
import { DOWNLOAD_TASK_CREATED_MESSAGE_HANDLER_TOKEN, DownloadTaskCreatedMessageHandlerImpl } from "./download_task_created";

export * from "./consumer";
export * from "./download_task_created";

export function bindToContainer(container: Container): void {
    container.bind(MQ_CONSUMER_TOKEN).toInstance(MQConsumer).inSingletonScope();
    container
        .bind(DOWNLOAD_TASK_CREATED_MESSAGE_HANDLER_TOKEN)
        .toInstance(DownloadTaskCreatedMessageHandlerImpl)
        .inSingletonScope();
}