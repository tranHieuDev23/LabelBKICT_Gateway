import { Container } from "brandi";
import { GATEWAY_CONFIG_TOKEN, GatewayConfig } from "./config";
import { GATEWAY_SERVER_CONFIG_TOKEN } from "./gateway_server";
import { USER_SERVICE_CONFIG_TOKEN } from "./user_service";
import { LOG_CONFIG_TOKEN } from "./log";
import { IMAGE_SERVICE_CONFIG_TOKEN } from "./image_service";
import { APPLICATION_CONFIG_TOKEN } from "./application";

export * from "./config";
export * from "./gateway_server";
export * from "./user_service";
export * from "./image_service";
export * from "./log";
export * from "./application";

export function bindToContainer(container: Container): void {
    container
        .bind(GATEWAY_CONFIG_TOKEN)
        .toInstance(GatewayConfig.fromEnv)
        .inSingletonScope();
    container
        .bind(GATEWAY_SERVER_CONFIG_TOKEN)
        .toInstance(
            () => container.get(GATEWAY_CONFIG_TOKEN).gatewayServerConfig
        )
        .inSingletonScope();
    container
        .bind(USER_SERVICE_CONFIG_TOKEN)
        .toInstance(() => container.get(GATEWAY_CONFIG_TOKEN).userServiceConfig)
        .inSingletonScope();
    container
        .bind(IMAGE_SERVICE_CONFIG_TOKEN)
        .toInstance(
            () => container.get(GATEWAY_CONFIG_TOKEN).imageServiceConfig
        )
        .inSingletonScope();
    container
        .bind(LOG_CONFIG_TOKEN)
        .toInstance(() => container.get(GATEWAY_CONFIG_TOKEN).logConfig)
        .inSingletonScope();
    container
        .bind(APPLICATION_CONFIG_TOKEN)
        .toInstance(() => container.get(GATEWAY_CONFIG_TOKEN).applicationConfig)
        .inSingletonScope();
}
