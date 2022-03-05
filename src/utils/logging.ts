import { join } from "path";
import { injected, token } from "brandi";
import { createLogger, format, Logger, transports } from "winston";
import { LogConfig, LOG_CONFIG_TOKEN } from "../config";

export function initializeLogger(logConfig: LogConfig): Logger {
    const logger = createLogger({
        format: format.combine(format.timestamp(), format.json()),
        defaultMeta: {},
        transports: [
            new transports.File({
                level: "error",
                filename: join(logConfig.logDir, "error.log"),
            }),
            new transports.File({
                level: "info",
                filename: join(logConfig.logDir, "info.log"),
            }),
        ],
    });

    if (process.env.NODE_ENV === "production") {
        logger.level = "info";
    } else {
        logger.level = "debug";
    }

    return logger;
}

injected(initializeLogger, LOG_CONFIG_TOKEN);

export const LOGGER_TOKEN = token<Logger>("Logger");
