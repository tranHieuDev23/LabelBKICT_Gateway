import express from "express";
import { Logger } from "winston";
import { UserServiceClient } from "../../proto/gen/UserService";

export function getSessionsRouter(
    userServiceClient: UserServiceClient,
    logger: Logger
): express.Router {
    const router = express.Router();

    router.post("/password", async (req, res) => {});

    router.delete("", async (req, res) => {});

    router.get("", async (req, res) => {});

    return router;
}
