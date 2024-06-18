import { Container } from "brandi";
import { LOCAL_CLIENT_TOKEN, LocalClient } from "./local";
import { FILE_CLIENT_TOKEN, newClient } from "./client";
import { S3_CLIENT_TOKEN, newS3Client } from "./s3";

export * from "./local";
export * from "./s3";

export function bindToContainer(container: Container): void {
    container.bind(LOCAL_CLIENT_TOKEN).toInstance(LocalClient).inSingletonScope();
    container.bind(S3_CLIENT_TOKEN).toInstance(newS3Client).inSingletonScope();
}