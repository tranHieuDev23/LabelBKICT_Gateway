import { token } from "brandi";

export class LogConfig {
    public logDir = "logs";

    public static fromEnv(): LogConfig {
        const config = new LogConfig();
        if (process.env.GATEWAY_LOG_DIR !== undefined) {
            config.logDir = process.env.GATEWAY_LOG_DIR;
        }
        return config;
    }
}

export const LOG_CONFIG_TOKEN = token<LogConfig>("LogConfig");
