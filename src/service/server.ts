import express from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import OpenApiValidator from "express-openapi-validator";
import { injected, token } from "brandi";
import { getUserRouter } from "./routes";
import { UserServiceClient } from "../proto/gen/UserService";
import { Logger } from "winston";
import { USER_SERVICE_DM_TOKEN } from "../dataaccess/grpc";
import { LOGGER_TOKEN } from "../utils";
import { getSessionsRouter } from "./routes/sessions";
import { getUserRolesRouter } from "./routes/user_roles";
import { getUserPermissionsRouter } from "./routes/user_permissions";

export function getGatewayHTTPServer(
    apiSpecPath: string,
    userServiceClient: UserServiceClient,
    logger: Logger
): express.Express {
    const server = express();

    server.use(express.json({ limit: "1mb" }));
    server.use(cookieParser());
    server.use(compression());
    server.use(express.urlencoded({ extended: false }));

    server.use(
        OpenApiValidator.middleware({
            apiSpec: apiSpecPath,
        })
    );

    server.use("/api/users", getUserRouter(userServiceClient, logger));
    server.use("/api/sessions", getSessionsRouter(userServiceClient, logger));
    server.use(
        "/api/user_roles",
        getUserRolesRouter(userServiceClient, logger)
    );
    server.use(
        "/api/user_permissions",
        getUserPermissionsRouter(userServiceClient, logger)
    );

    return server;
}

export const API_SPEC_PATH_TOKEN = token<string>("apiSpecPath");

injected(
    getGatewayHTTPServer,
    API_SPEC_PATH_TOKEN,
    USER_SERVICE_DM_TOKEN,
    LOGGER_TOKEN
);

export const GATEWAY_HTTP_SERVER_TOKEN =
    token<express.Express>("express.Express");
