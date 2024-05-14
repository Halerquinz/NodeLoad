import { Container } from "brandi";
import { LOGGER_TOKEN, initializeLogger } from "./logging";
import { TIMER_TOKEN, TimeImpl } from "./time";
import { ID_GENERATOR_TOKEN, SnowflakeIdGenerator } from "./snowflake_id";

export * from "./logging";
export * from "./errors";
export * from "./time";
export * from "./snowflake_id";
export * from "./sensitive_info";

export function bindToContainer(container: Container): void {
    container.bind(LOGGER_TOKEN).toInstance(initializeLogger).inSingletonScope();
    container.bind(TIMER_TOKEN).toInstance(TimeImpl).inSingletonScope();
    container.bind(ID_GENERATOR_TOKEN).toInstance(SnowflakeIdGenerator).inSingletonScope();
}