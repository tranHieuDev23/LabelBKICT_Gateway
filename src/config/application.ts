import { token } from "brandi";

export class ApplicationConfig {
    public originalImageURLPrefix = "static";
    public thumbnailImageURLPrefix = "static";
    public exportFileURLPrefix = "static";

    public static fromEnv(): ApplicationConfig {
        const config = new ApplicationConfig();
        if (process.env.ORIGINAL_IMAGE_URL_PREFIX !== undefined) {
            config.originalImageURLPrefix =
                process.env.ORIGINAL_IMAGE_URL_PREFIX;
        }
        if (process.env.THUMBNAIL_IMAGE_URL_PREFIX !== undefined) {
            config.thumbnailImageURLPrefix =
                process.env.THUMBNAIL_IMAGE_URL_PREFIX;
        }
        if (process.env.EXPORT_FILE_URL_PREFIX !== undefined) {
            config.exportFileURLPrefix = process.env.EXPORT_FILE_URL_PREFIX;
        }
        return config;
    }
}

export const APPLICATION_CONFIG_TOKEN =
    token<ApplicationConfig>("ApplicationConfig");
