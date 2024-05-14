import { Container } from "brandi";
import * as utils from "./utils";
import * as routes from "./routes";
import { HTTP_SERVER_TOKEN, HTTPServer } from "./server";

export * from "./server";

export function bindToContainer(container: Container): void {
    utils.bindToContainer(container);
    routes.bindToContainer(container);
    container
        .bind(HTTP_SERVER_TOKEN)
        .toInstance(HTTPServer)
        .inSingletonScope();
}