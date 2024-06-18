import { token } from "brandi";

export class DatabaseConfig {
    public host = "127.0.0.1";
    public port = 3306;
    public username = "root";
    public password = "admin";
    public database = "nodeload";

    public static fromEnv(): DatabaseConfig {
        const config = new DatabaseConfig();
        if (process.env.MYSQL_HOST !== undefined) {
            config.host = process.env.MYSQL_HOST;
        }
        if (process.env.MYSQL_PORT !== undefined) {
            config.port = +process.env.MYSQL_PORT;
        }
        if (process.env.MYSQL_USER !== undefined) {
            config.username = process.env.MYSQL_USER;
        }
        if (process.env.MYSQL_PASSWORD !== undefined) {
            config.password = process.env.MYSQL_PASSWORD;
        }
        if (process.env.MYSQL_DB !== undefined) {
            config.database = process.env.MYSQL_DB;
        }
        return config;
    }
}

export const DATABASE_CONFIG_TOKEN = token<DatabaseConfig>("DatabaseConfig");