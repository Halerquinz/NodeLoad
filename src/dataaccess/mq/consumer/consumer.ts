import { injected, token } from "brandi";
import { Consumer, Kafka } from "kafkajs";
import { MQConfig, MQ_CONFIG_TOKEN } from "../../../config";
import { KAFKA_INSTANCE_TOKEN } from "../kafka";

export function getKafkaConsumer(kafka: Kafka, config: MQConfig): Consumer {
    return kafka.consumer({
        groupId: config.consumerGroupId
    });
}

injected(getKafkaConsumer, KAFKA_INSTANCE_TOKEN, MQ_CONFIG_TOKEN);

export const KAFKA_CONSUMER_TOKEN = token<Consumer>("Consumer");