import minimist from "minimist";
import { startHTTPServer } from "./cmd/start_http_server";
import { startMQConsumer } from "./cmd/start_mq_consumer";

const args = minimist(process.argv);

if (args["start_http_server"]) {
    startHTTPServer(".env").then();
} else if (args["start_mq_consumer"]) {
    startMQConsumer("");
} else {
    startHTTPServer(".env").then();
}