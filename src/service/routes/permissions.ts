import { injected, token } from "brandi";
import express from "express";
import { Logger } from "winston";
import { USER_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { UserServiceClient } from "../../proto/gen/UserService";
import { LOGGER_TOKEN } from "../../utils";

export function getUserPermissionsRouter(
    userServiceClient: UserServiceClient,
    logger: Logger
): express.Router {
    const router = express.Router();

    router.post("/api/permissions", async (req, res) => {});

    router.get("/api/permissions", async (req, res) => {});

    router.patch("/api/permissions/:userPermissionID", async (req, res) => {});

    router.delete("/api/permissions/:userPermissionID", async (req, res) => {});

    return router;
}

injected(getUserPermissionsRouter, USER_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const USER_PERMISSIONS_ROUTER_TOKEN = token<express.Router>(
    "UserPermissionsRouter"
);
