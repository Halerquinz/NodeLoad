import { token } from "brandi";

export class HTTPServerConfig {
    public port = 8080;

    public static fromEnv(): HTTPServerConfig {
        const config = new HTTPServerConfig();
        if (process.env.HTTP_PORT !== undefined) {
            config.port = +process.env.HTTP_PORT;
        }
        return config;
    }
}

export const HTTP_SERVER_CONFIG_TOKEN = token<HTTPServerConfig>("HTTPServerConfig")
