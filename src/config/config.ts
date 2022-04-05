import { token } from "brandi";
import { UserServiceConfig } from "./user_service";
import { LogConfig } from "./log";
import { GatewayServerConfig } from "./gateway_server";
import { ImageServiceConfig } from "./image_service";
import { ApplicationConfig } from "./application";
import { ExportServiceConfig } from "./export_service";
import { ModelServiceConfig } from "./model_service";
import { PinPageServiceConfig } from "./pin_page_service";

export class GatewayConfig {
    public gatewayServerConfig = new GatewayServerConfig();
    public userServiceConfig = new UserServiceConfig();
    public imageServiceConfig = new ImageServiceConfig();
    public exportServiceConfig = new ExportServiceConfig();
    public modelServiceConfig = new ModelServiceConfig();
    public pinPageServiceConfig = new PinPageServiceConfig();
    public logConfig = new LogConfig();
    public applicationConfig = new ApplicationConfig();

    public static fromEnv(): GatewayConfig {
        const config = new GatewayConfig();
        config.gatewayServerConfig = GatewayServerConfig.fromEnv();
        config.userServiceConfig = UserServiceConfig.fromEnv();
        config.imageServiceConfig = ImageServiceConfig.fromEnv();
        config.exportServiceConfig = ExportServiceConfig.fromEnv();
        config.modelServiceConfig = ModelServiceConfig.fromEnv();
        config.pinPageServiceConfig = PinPageServiceConfig.fromEnv();
        config.logConfig = LogConfig.fromEnv();
        config.applicationConfig = ApplicationConfig.fromEnv();
        return config;
    }
}

export const GATEWAY_CONFIG_TOKEN = token<GatewayConfig>("GatewayConfig");
