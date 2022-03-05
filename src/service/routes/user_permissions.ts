import express from "express";
import { Logger } from "winston";
import { UserServiceClient } from "../../proto/gen/UserService";

export function getUserPermissionsRouter(
    userServiceClient: UserServiceClient,
    logger: Logger
): express.Router {
    const router = express.Router();

    router.post("", async (req, res) => {});

    router.get("", async (req, res) => {});

    router.patch("/:userPermissionID", async (req, res) => {});

    router.delete("/:userPermissionID", async (req, res) => {});

    return router;
}
