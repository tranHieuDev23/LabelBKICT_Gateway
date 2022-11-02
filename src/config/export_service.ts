import { token } from "brandi";

export class ExportServiceConfig {
    public protoPath = "./src/proto/dependencies/export_service.proto";
    public host = "127.0.0.1";
    public port = 20002;

    public static fromEnv(): ExportServiceConfig {
        const config = new ExportServiceConfig();
        if (process.env.EXPORT_SERVICE_PROTO_PATH !== undefined) {
            config.protoPath = process.env.EXPORT_SERVICE_PROTO_PATH;
        }
        if (process.env.EXPORT_SERVICE_HOST !== undefined) {
            config.host = process.env.EXPORT_SERVICE_HOST;
        }
        if (process.env.EXPORT_SERVICE_PORT !== undefined) {
            config.port = +process.env.EXPORT_SERVICE_PORT;
        }
        return config;
    }
}

export const EXPORT_SERVICE_CONFIG_TOKEN = token<ExportServiceConfig>(
    "ExportServiceConfig"
);
