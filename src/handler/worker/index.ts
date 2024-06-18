import { Container } from "brandi";
import { SERVER_WORKER_TOKEN, ServerWorker } from "./worker";

export * from "./worker";

export function bindToContainer(container: Container): void {
    container.bind(SERVER_WORKER_TOKEN).toInstance(ServerWorker).inSingletonScope();
}