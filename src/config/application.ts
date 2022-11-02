import { token } from "brandi";

export class ApplicationConfig {
    public originalImageURLPrefix = "static/originals";
    public thumbnailImageURLPrefix = "static/thumbnails";
    public screenshotImageURLPrefix = "static/screenshots";

    public static fromEnv(): ApplicationConfig {
        const config = new ApplicationConfig();
        if (process.env.GATEWAY_ORIGINAL_IMAGE_URL_PREFIX !== undefined) {
            config.originalImageURLPrefix = process.env.GATEWAY_ORIGINAL_IMAGE_URL_PREFIX;
        }
        if (process.env.GATEWAY_THUMBNAIL_IMAGE_URL_PREFIX !== undefined) {
            config.thumbnailImageURLPrefix = process.env.GATEWAY_THUMBNAIL_IMAGE_URL_PREFIX;
        }
        if (process.env.GATEWAY_SCREENSHOT_IMAGE_URL_PREFIX !== undefined) {
            config.screenshotImageURLPrefix = process.env.GATEWAY_SCREENSHOT_IMAGE_URL_PREFIX;
        }
        return config;
    }
}

export const APPLICATION_CONFIG_TOKEN = token<ApplicationConfig>("ApplicationConfig");
