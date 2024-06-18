import { Container } from "brandi";
import dotenv from "dotenv";
import * as config from "../config";
import * as db from "../dataaccess/db";
import * as file from "../dataaccess/file";
import * as cache from "../dataaccess/cache";
import * as mq from "../dataaccess/mq";
import * as bull from "../dataaccess/bull";
import * as user from "../module/user";
import * as token from "../module/token";
import * as password from "../module/password";
import * as downloadTask from "../module/download_task";
import * as utils from "../utils";
import * as http from "../handler/http";
import * as consumerHandler from "../handler/consumers";

export async function startMQConsumer(dotEnvPath: string): Promise<void> {
    dotenv.config({ path: dotEnvPath });

    const container = new Container();
    config.bindToContainer(container);
    db.bindToContainer(container);
    file.bindToContainer(container);
    cache.bindToContainer(container);
    mq.bindToContainer(container);
    bull.bindToContainer(container);
    utils.bindToContainer(container);
    downloadTask.bindToContainer(container);
    http.bindToContainer(container);
    user.bindToContainer(container);
    await token.bindToContainer(container);
    password.bindToContainer(container);
    consumerHandler.bindToContainer(container);

    const mqConsumer = container.get(consumerHandler.MQ_CONSUMER_TOKEN);
    mqConsumer.start();
}