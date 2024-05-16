import { Container } from "brandi";
import { DOWNLOAD_TASK_CREATED_PRODUCER_TOKEN, DownloadTaskCreatedProducerImpl } from "./download_task_created";
import { KAFKA_PRODUCER_TOKEN, getKafkaProducer } from "./producer";

export * from "./download_task_created";
export * from "./producer";

export function bindToContainer(container: Container): void {
    container.bind(KAFKA_PRODUCER_TOKEN).toInstance(getKafkaProducer).inSingletonScope();
    container.bind(DOWNLOAD_TASK_CREATED_PRODUCER_TOKEN).toInstance(DownloadTaskCreatedProducerImpl).inSingletonScope();
}