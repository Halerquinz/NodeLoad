import { Container } from "brandi";
import { EXECUTE_ALL_PENDING_DOWNLOAD_TASK_QUEUE_TOKEN, ExecuteAllPendingDownloadTaskQueueImpl } from "./execute_all_pending_download_task";

export * from "./execute_all_pending_download_task";

export function bindToContainer(container: Container): void {
    container.bind(EXECUTE_ALL_PENDING_DOWNLOAD_TASK_QUEUE_TOKEN).toInstance(ExecuteAllPendingDownloadTaskQueueImpl).inSingletonScope();
}