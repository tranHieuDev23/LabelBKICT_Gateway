import { token } from "brandi";
import { UserServiceConfig } from "./user_service";
import { LogConfig } from "./log";

export class GatewayConfig {
    public userServiceConfig = new UserServiceConfig();
    public logConfig = new LogConfig();

    public static fromEnv(): GatewayConfig {
        const config = new GatewayConfig();
        config.userServiceConfig = UserServiceConfig.fromEnv();
        config.logConfig = LogConfig.fromEnv();
        return config;
    }
}

export const GATEWAY_CONFIG_TOKEN = token<GatewayConfig>("GatewayConfig");
