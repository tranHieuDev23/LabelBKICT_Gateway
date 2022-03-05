import express from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import { middleware } from "express-openapi-validator";
import { injected, token } from "brandi";
import { getUserRouter } from "./routes";
import { UserServiceClient } from "../proto/gen/UserService";
import { Logger } from "winston";
import { getSessionsRouter } from "./routes/sessions";
import { getUserRolesRouter } from "./routes/user_roles";
import { getUserPermissionsRouter } from "./routes/user_permissions";
import { GatewayServerConfig, GATEWAY_SERVER_CONFIG_TOKEN } from "../config";
import { USER_SERVICE_DM_TOKEN } from "../dataaccess/grpc";
import { LOGGER_TOKEN } from "../utils";

export class GatewayHTTPServer {
    constructor(
        private readonly gatewayServerConfig: GatewayServerConfig,
        private readonly userServiceDM: UserServiceClient,
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
        server.use(cookieParser());
        server.use(compression());
        server.use(express.urlencoded({ extended: false }));

        server.use(
            middleware({
                apiSpec: apiSpecPath,
            })
        );

        server.use(
            "/api/users",
            getUserRouter(this.userServiceDM, this.logger)
        );
        server.use(
            "/api/sessions",
            getSessionsRouter(this.userServiceDM, this.logger)
        );
        server.use(
            "/api/user_roles",
            getUserRolesRouter(this.userServiceDM, this.logger)
        );
        server.use(
            "/api/user_permissions",
            getUserPermissionsRouter(this.userServiceDM, this.logger)
        );

        return server;
    }
}

injected(
    GatewayHTTPServer,
    GATEWAY_SERVER_CONFIG_TOKEN,
    USER_SERVICE_DM_TOKEN,
    LOGGER_TOKEN
);

export const GATEWAY_HTTP_SERVER_TOKEN =
    token<GatewayHTTPServer>("GatewayHTTPServer");
