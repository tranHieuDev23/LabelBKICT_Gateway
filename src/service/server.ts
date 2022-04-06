import express from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import { middleware } from "express-openapi-validator";
import { injected, token } from "brandi";
import { ROUTES_TOKEN } from "./routes";
import { Logger } from "winston";
import {
    ApplicationConfig,
    APPLICATION_CONFIG_TOKEN,
    GatewayServerConfig,
    GATEWAY_SERVER_CONFIG_TOKEN,
    ImageServiceConfig,
    IMAGE_SERVICE_CONFIG_TOKEN,
    PinPageServiceConfig,
    PIN_PAGE_SERVICE_CONFIG_TOKEN,
} from "../config";
import { LOGGER_TOKEN } from "../utils";
import { ERROR_HANDLER_MIDDLEWARE_TOKEN } from "./utils";

export class GatewayHTTPServer {
    constructor(
        private readonly routes: express.Router[],
        private readonly errorHandler: express.ErrorRequestHandler,
        private readonly gatewayServerConfig: GatewayServerConfig,
        private readonly applicationConfig: ApplicationConfig,
        private readonly imageServiceConfig: ImageServiceConfig,
        private readonly pinPageServiceConfig: PinPageServiceConfig,
        private readonly logger: Logger
    ) {}

    public loadAPIDefinitionAndStart(apiSpecPath: string): void {
        const server = this.getGatewayHTTPServer(apiSpecPath);
        server.listen(this.gatewayServerConfig.port, () => {
            console.log(
                `started http server, listening to port ${this.gatewayServerConfig.port}`
            );
            this.logger.info("started http server", {
                port: this.gatewayServerConfig.port,
            });
        });
    }

    private getGatewayHTTPServer(apiSpecPath: string): express.Express {
        const server = express();

        server.use(express.json({ limit: "1mb" }));
        server.use(express.urlencoded({ extended: true }));
        server.use(cookieParser());
        server.use(compression());

        server.use(
            `/${this.applicationConfig.originalImageURLPrefix}`,
            express.static(this.imageServiceConfig.originalImageDir)
        );
        server.use(
            `/${this.applicationConfig.thumbnailImageURLPrefix}`,
            express.static(this.imageServiceConfig.thumbnailImageDir)
        );
        server.use(
            `/${this.applicationConfig.screenshotImageURLPrefix}`,
            express.static(this.pinPageServiceConfig.screenshotDir)
        );

        server.use(
            middleware({
                apiSpec: apiSpecPath,
            })
        );

        server.use(this.routes);
        server.use(this.errorHandler);

        return server;
    }
}

injected(
    GatewayHTTPServer,
    ROUTES_TOKEN,
    ERROR_HANDLER_MIDDLEWARE_TOKEN,
    GATEWAY_SERVER_CONFIG_TOKEN,
    APPLICATION_CONFIG_TOKEN,
    IMAGE_SERVICE_CONFIG_TOKEN,
    PIN_PAGE_SERVICE_CONFIG_TOKEN,
    LOGGER_TOKEN
);

export const GATEWAY_HTTP_SERVER_TOKEN =
    token<GatewayHTTPServer>("GatewayHTTPServer");
