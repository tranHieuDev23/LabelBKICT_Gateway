import { Container } from "brandi";
import { GATEWAY_CONFIG_TOKEN, GatewayConfig } from "./config";
import { GATEWAY_SERVER_CONFIG_TOKEN } from "./gateway_server";
import { USER_SERVICE_CONFIG_TOKEN } from "./user_service";
import { LOG_CONFIG_TOKEN } from "./log";
import { IMAGE_SERVICE_CONFIG_TOKEN } from "./image_service";
import { APPLICATION_CONFIG_TOKEN } from "./application";
import { EXPORT_SERVICE_CONFIG_TOKEN } from "./export_service";
import { MODEL_SERVICE_CONFIG_TOKEN } from "./model_service";
import { PIN_PAGE_SERVICE_CONFIG_TOKEN } from "./pin_page_service";
import { ELASTICSEARCH_CONFIG_TOKEN } from "./elasticsearch";

export * from "./config";
export * from "./gateway_server";
export * from "./user_service";
export * from "./image_service";
export * from "./export_service";
export * from "./model_service";
export * from "./pin_page_service";
export * from "./log";
export * from "./elasticsearch";
export * from "./application";

export function bindToContainer(container: Container): void {
    container.bind(GATEWAY_CONFIG_TOKEN).toInstance(GatewayConfig.fromEnv).inSingletonScope();
    container
        .bind(GATEWAY_SERVER_CONFIG_TOKEN)
        .toInstance(() => container.get(GATEWAY_CONFIG_TOKEN).gatewayServerConfig)
        .inSingletonScope();
    container
        .bind(USER_SERVICE_CONFIG_TOKEN)
        .toInstance(() => container.get(GATEWAY_CONFIG_TOKEN).userServiceConfig)
        .inSingletonScope();
    container
        .bind(IMAGE_SERVICE_CONFIG_TOKEN)
        .toInstance(() => container.get(GATEWAY_CONFIG_TOKEN).imageServiceConfig)
        .inSingletonScope();
    container
        .bind(EXPORT_SERVICE_CONFIG_TOKEN)
        .toInstance(() => container.get(GATEWAY_CONFIG_TOKEN).exportServiceConfig)
        .inSingletonScope();
    container
        .bind(PIN_PAGE_SERVICE_CONFIG_TOKEN)
        .toInstance(() => container.get(GATEWAY_CONFIG_TOKEN).pinPageServiceConfig)
        .inSingletonScope();
    container
        .bind(MODEL_SERVICE_CONFIG_TOKEN)
        .toInstance(() => container.get(GATEWAY_CONFIG_TOKEN).modelServiceConfig)
        .inSingletonScope();
    container
        .bind(LOG_CONFIG_TOKEN)
        .toInstance(() => container.get(GATEWAY_CONFIG_TOKEN).logConfig)
        .inSingletonScope();
    container
        .bind(APPLICATION_CONFIG_TOKEN)
        .toInstance(() => container.get(GATEWAY_CONFIG_TOKEN).applicationConfig)
        .inSingletonScope();
    container
        .bind(ELASTICSEARCH_CONFIG_TOKEN)
        .toInstance(() => container.get(GATEWAY_CONFIG_TOKEN).elasticsearchConfig)
        .inSingletonScope();
}
