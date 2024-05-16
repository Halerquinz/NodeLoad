import { Container } from "brandi";
import { DOWNLOAD_TASK_MANAGEMENT_OPERATOR_TOKEN, DownloadTaskManagementOperatorImpl } from "./download_task_management_operator";

export * from "./download_task_management_operator";
export * from "./downloader";

export function bindToContainer(container: Container): void {
    container.bind(DOWNLOAD_TASK_MANAGEMENT_OPERATOR_TOKEN).toInstance(DownloadTaskManagementOperatorImpl).inSingletonScope();
}