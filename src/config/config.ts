import { token } from "brandi";
import { UserServiceConfig } from "./user_service";
import { LogConfig } from "./log";
import { GatewayServerConfig } from "./gateway_server";
import { ImageServiceConfig } from "./image_service";
import { ApplicationConfig } from "./application";

export class GatewayConfig {
    public gatewayServerConfig = new GatewayServerConfig();
    public userServiceConfig = new UserServiceConfig();
    public imageServiceConfig = new ImageServiceConfig();
    public logConfig = new LogConfig();
    public applicationConfig = new ApplicationConfig();

    public static fromEnv(): GatewayConfig {
        const config = new GatewayConfig();
        config.gatewayServerConfig = GatewayServerConfig.fromEnv();
        config.userServiceConfig = UserServiceConfig.fromEnv();
        config.imageServiceConfig = ImageServiceConfig.fromEnv();
        config.logConfig = LogConfig.fromEnv();
        config.applicationConfig = ApplicationConfig.fromEnv();
        return config;
    }
}

export const GATEWAY_CONFIG_TOKEN = token<GatewayConfig>("GatewayConfig");
