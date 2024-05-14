import minimist from "minimist";
import { startHTTPServer } from "./cmd/start_http_server";

const args = minimist(process.argv);

startHTTPServer(".env");