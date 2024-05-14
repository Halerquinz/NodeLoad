import { injected, token } from "brandi";
import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import { Logger } from "winston";
import { HTTPServerConfig, HTTP_SERVER_CONFIG_TOKEN } from "../../config";
import { LOGGER_TOKEN } from "../../utils";
import { ROUTES_TOKEN } from "./routes";
import { ERROR_HANDLER_MIDDLEWARE_FACTORY_TOKEN, ErrorHandlerMiddlewareFactory } from "./utils";

export class HTTPServer {
    constructor(
        private readonly routes: express.Router[],
        private readonly errorHandlerMiddlewareFactory: ErrorHandlerMiddlewareFactory,
        private readonly logger: Logger,
        private readonly httpServerConfig: HTTPServerConfig
    ) { }

    public loadApiDefinitionAndStart(apiSpecPath: string): void {
        const server = this.getGatewayHTTPServer(apiSpecPath);
        server.listen(this.httpServerConfig.port, () => {
            console.log(`server http is listening on port ${this.httpServerConfig.port} `)
            this.logger.info("started http server", {
                port: this.httpServerConfig.port,
            });
        })
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private getGatewayHTTPServer(_apiSpecPath: string): express.Express {
        const server = express();
        server.use(express.json({ limit: "1mb" }));
        server.use(express.urlencoded({ extended: true }));
        server.use(cookieParser());
        server.use(compression());
        server.use(this.routes);
        server.use(this.errorHandlerMiddlewareFactory.getErrorHandlerMiddleware());
        return server;
    }
}

injected(HTTPServer, ROUTES_TOKEN, ERROR_HANDLER_MIDDLEWARE_FACTORY_TOKEN, LOGGER_TOKEN, HTTP_SERVER_CONFIG_TOKEN);

export const HTTP_SERVER_TOKEN = token<HTTPServer>("HTTPServer");