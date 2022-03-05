import express from "express";
import { Logger } from "winston";
import { UserServiceClient } from "../../proto/gen/UserService";

export function getUserRolesRouter(
    userServiceClient: UserServiceClient,
    logger: Logger
): express.Router {
    const router = express.Router();

    router.post("", async (req, res) => {});

    router.get("", async (req, res) => {});

    router.patch("/:userRoleID", async (req, res) => {});

    router.delete("/:userRoleID", async (req, res) => {});

    router.post("/permissions", async (req, res) => {});

    router.delete("/permissions/:userPermissionID", async (req, res) => {});

    return router;
}
