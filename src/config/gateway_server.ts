import { token } from "brandi";

export class GatewayServerConfig {
    public port = 19999;
    public originalImageDir = "originals";
    public thumbnailImageDir = "thumbnails";

    public static fromEnv(): GatewayServerConfig {
        const config = new GatewayServerConfig();
        if (process.env.GATEWAY_PORT !== undefined) {
            config.port = +process.env.GATEWAY_PORT;
        }
        if (process.env.ORIGINAL_IMAGE_DIR !== undefined) {
            config.originalImageDir = process.env.ORIGINAL_IMAGE_DIR;
        }
        if (process.env.THUMBNAIL_IMAGE_DIR !== undefined) {
            config.thumbnailImageDir = process.env.THUMBNAIL_IMAGE_DIR;
        }
        return config;
    }
}

export const GATEWAY_SERVER_CONFIG_TOKEN = token<GatewayServerConfig>(
    "GatewayServerConfig"
);
