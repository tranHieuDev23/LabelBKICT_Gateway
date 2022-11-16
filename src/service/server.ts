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
    S3Config,
    S3_CONFIG_TOKEN,
} from "../config";
import { isProductionEnvironment, LOGGER_TOKEN } from "../utils";
import { ERROR_HANDLER_MIDDLEWARE_TOKEN, S3MiddlewareFactory, MINIO_MIDDLEWARE_FACTORY_TOKEN } from "./utils";

export class GatewayHTTPServer {
    constructor(
        private readonly routes: express.Router[],
        private readonly errorHandler: express.ErrorRequestHandler,
        private readonly minioMiddlewareFactory: S3MiddlewareFactory,
        private readonly gatewayServerConfig: GatewayServerConfig,
        private readonly applicationConfig: ApplicationConfig,
        private readonly s3Config: S3Config,
        private readonly logger: Logger
    ) {}

    public loadAPIDefinitionAndStart(apiSpecPath: string): void {
        const server = this.getGatewayHTTPServer(apiSpecPath);
        server.listen(this.gatewayServerConfig.port, () => {
            console.log(`started http server, listening to port ${this.gatewayServerConfig.port}`);
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
            middleware({
                apiSpec: apiSpecPath,
                ignoreUndocumented: true,
            })
        );

        if (!isProductionEnvironment()) {
            this.logger.info("running in development environment, will use s3 middleware to serve static files");
            server.get(
                `/${this.applicationConfig.originalImageURLPrefix}`,
                this.minioMiddlewareFactory.getS3Middleware(this.s3Config.originalImageBucket)
            );
            server.get(
                `/${this.applicationConfig.thumbnailImageURLPrefix}`,
                this.minioMiddlewareFactory.getS3Middleware(this.s3Config.thumbnailImageBucket)
            );
            server.get(
                `/${this.applicationConfig.screenshotImageURLPrefix}`,
                this.minioMiddlewareFactory.getS3Middleware(this.s3Config.screenshotBucket)
            );
        }

        server.use(this.routes);
        server.use(this.errorHandler);

        return server;
    }
}

injected(
    GatewayHTTPServer,
    ROUTES_TOKEN,
    ERROR_HANDLER_MIDDLEWARE_TOKEN,
    MINIO_MIDDLEWARE_FACTORY_TOKEN,
    GATEWAY_SERVER_CONFIG_TOKEN,
    APPLICATION_CONFIG_TOKEN,
    S3_CONFIG_TOKEN,
    LOGGER_TOKEN
);

export const GATEWAY_HTTP_SERVER_TOKEN = token<GatewayHTTPServer>("GatewayHTTPServer");
