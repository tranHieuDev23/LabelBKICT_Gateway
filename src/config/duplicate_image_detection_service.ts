import { token } from "brandi";

export class DuplicateImageDetectionServiceConfig {
    public protoPath = "./src/proto/dependencies/duplicate_image_detection_service.proto";
    public host = "127.0.0.1";
    public port = 20006;

    public static fromEnv(): DuplicateImageDetectionServiceConfig {
        const config = new DuplicateImageDetectionServiceConfig();
        if (process.env.DUPLICATE_IMAGE_DETECTION_SERVICE_PROTO_PATH !== undefined) {
            config.protoPath = process.env.DUPLICATE_IMAGE_DETECTION_SERVICE_PROTO_PATH;
        }
        if (process.env.DUPLICATE_IMAGE_DETECTION_SERVICE_HOST !== undefined) {
            config.host = process.env.DUPLICATE_IMAGE_DETECTION_SERVICE_HOST;
        }
        if (process.env.DUPLICATE_IMAGE_DETECTION_SERVICE_PORT !== undefined) {
            config.port = +process.env.DUPLICATE_IMAGE_DETECTION_SERVICE_PORT;
        }
        return config;
    }
}

export const DUPLICATE_IMAGE_DETECTION_SERVICE_CONFIG_TOKEN =
    token<DuplicateImageDetectionServiceConfig>("DuplicateImageDetectionServiceConfig");
