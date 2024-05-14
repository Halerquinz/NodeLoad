import { Container } from "brandi";
import dotenv from "dotenv";
import * as config from "../config";
import * as db from "../dataaccess/db";
import * as user from "../module/user";
import * as token from "../module/token";
import * as password from "../module/password";
import * as utils from "../utils";
import * as http from "../handler/http";

export async function startHTTPServer(dotEnvPath: string): Promise<void> {
    dotenv.config({ path: dotEnvPath });

    const container = new Container();
    config.bindToContainer(container);
    db.bindToContainer(container);
    utils.bindToContainer(container);
    http.bindToContainer(container);
    user.bindToContainer(container);
    await token.bindToContainer(container);
    password.bindToContainer(container);

    const server = container.get(http.HTTP_SERVER_TOKEN);
    server.loadApiDefinitionAndStart("/");
}