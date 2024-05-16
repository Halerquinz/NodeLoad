import { token } from "brandi";

export class MQConfig {
    public clientId = "nodeload";
    public consumerGroupId = "nodeload";
    public brokers: string[] = [];
    public heartbeatInterval = 10000;

    public static fromEnv(): MQConfig {
        const config = new MQConfig();
        if (process.env.MQ_CLIENT_ID !== undefined) {
            config.clientId = process.env.MQ_CLIENT_ID;
        }
        if (process.env.MQ_CONSUMER_GROUP_ID !== undefined) {
            config.consumerGroupId = process.env.MQ_CONSUMER_GROUP_ID;
        }
        if (process.env.MQ_BROKERS !== undefined) {
            config.brokers = process.env.MQ_BROKERS.split(",");
        }
        if (process.env.MQ_HEARTBEAT_INTERVAL !== undefined) {
            config.heartbeatInterval = +process.env.MQ_HEARTBEAT_INTERVAL;
        }
        return config;
    }
}

export const MQ_CONFIG_TOKEN = token<MQConfig>("MQConfig");