import { Container } from "brandi";
import { GATEWAY_CONFIG_TOKEN, GatewayConfig } from "./config";
import { USER_SERVICE_CONFIG_TOKEN } from "./user_service";
import { LOG_CONFIG_TOKEN } from "./log";

export * from "./config";
export * from "./user_service";
export * from "./log";

export function bindToContainer(container: Container): void {
    container
        .bind(GATEWAY_CONFIG_TOKEN)
        .toInstance(GatewayConfig.fromEnv)
        .inSingletonScope();
    container
        .bind(USER_SERVICE_CONFIG_TOKEN)
        .toInstance(() => container.get(GATEWAY_CONFIG_TOKEN).userServiceConfig)
        .inSingletonScope();
    container
        .bind(LOG_CONFIG_TOKEN)
        .toInstance(() => container.get(GATEWAY_CONFIG_TOKEN).logConfig)
        .inSingletonScope();
}
