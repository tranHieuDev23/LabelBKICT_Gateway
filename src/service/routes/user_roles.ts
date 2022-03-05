import { injected, token } from "brandi";
import express from "express";
import { Logger } from "winston";
import { USER_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { UserServiceClient } from "../../proto/gen/UserService";
import { LOGGER_TOKEN } from "../../utils";

export function getUserRolesRouter(
    userServiceClient: UserServiceClient,
    logger: Logger
): express.Router {
    const router = express.Router();

    router.post("/api/user_roles", async (req, res) => {});

    router.get("/api/user_roles", async (req, res) => {});

    router.patch("/api/user_roles/:userRoleID", async (req, res) => {});

    router.delete("/api/user_roles/:userRoleID", async (req, res) => {});

    router.post("/api/user_roles/:userID/permissions", async (req, res) => {});

    router.delete(
        "/api/user_roles/:userID/permissions/:userPermissionID",
        async (req, res) => {}
    );

    return router;
}

injected(getUserRolesRouter, USER_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const USER_ROLES_ROUTER_TOKEN = token<express.Router>("UserRolesRouter");
