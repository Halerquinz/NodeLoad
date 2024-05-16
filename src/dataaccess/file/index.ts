import { Container } from "brandi";
import { LOCAL_CLIENT_TOKEN, LocalClient } from "./local";
import { FILE_CLIENT_TOKEN, newClient } from "./client";

export * from "./local";
export * from "./client";

export function bindToContainer(container: Container): void {
    container.bind(FILE_CLIENT_TOKEN).toInstance(newClient).inSingletonScope();
    container.bind(LOCAL_CLIENT_TOKEN).toInstance(LocalClient).inSingletonScope();
}