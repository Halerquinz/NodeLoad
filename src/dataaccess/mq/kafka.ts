import { injected, token } from "brandi";
import { Kafka } from "kafkajs";
import { MQConfig, MQ_CONFIG_TOKEN } from "../../config";

export function getInstanceKafka(config: MQConfig): Kafka {
    return new Kafka({
        clientId: config.clientId,
        brokers: config.brokers,
        retry: {
            initialRetryTime: 300,
            retries: 1
        }
    });
}

injected(getInstanceKafka, MQ_CONFIG_TOKEN);

export const KAFKA_INSTANCE_TOKEN = token<Kafka>("Kafka");