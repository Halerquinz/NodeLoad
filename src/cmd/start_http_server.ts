import { Container } from "brandi";
import dotenv from "dotenv";
import * as config from "../config";
import * as modules from "../module";
import * as utils from "../utils";
import * as http from "../handler/http";


export function startHTTPServer(dotEnvPath: string): void {
    dotenv.config({ path: dotEnvPath });

    const container = new Container();
    config.bindToContainer(container);
    modules.bindToContainer(container);
    utils.bindToContainer(container);
    http.bindToContainer(container);

    const server = container.get(http.HTTP_SERVER_TOKEN);
    server.loadApiDefinitionAndStart("/");
}