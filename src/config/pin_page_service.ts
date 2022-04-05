import { token } from "brandi";

export class PinPageServiceConfig {
    public protoPath = "./src/proto/dependencies/pin_page_service.proto";
    public host = "127.0.0.1";
    public port = 20004;
    public screenshotDir = "screenshots";

    public static fromEnv(): PinPageServiceConfig {
        const config = new PinPageServiceConfig();
        if (process.env.PIN_PAGE_SERVICE_PROTO_PATH !== undefined) {
            config.protoPath = process.env.PIN_PAGE_SERVICE_PROTO_PATH;
        }
        if (process.env.PIN_PAGE_SERVICE_HOST !== undefined) {
            config.host = process.env.PIN_PAGE_SERVICE_HOST;
        }
        if (process.env.PIN_PAGE_SERVICE_PORT !== undefined) {
            config.port = +process.env.PIN_PAGE_SERVICE_PORT;
        }
        if (process.env.PIN_PAGE_SERVICE_SCREENSHOT_DIR !== undefined) {
            config.screenshotDir = process.env.PIN_PAGE_SERVICE_SCREENSHOT_DIR;
        }
        return config;
    }
}

export const PIN_PAGE_SERVICE_CONFIG_TOKEN = token<PinPageServiceConfig>(
    "PinPageServiceConfig"
);
