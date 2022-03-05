import { injected, token } from "brandi";
import express from "express";
import { Logger } from "winston";
import { USER_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { UserServiceClient } from "../../proto/gen/UserService";
import { LOGGER_TOKEN } from "../../utils";

export function getSessionsRouter(
    userServiceDM: UserServiceClient,
    logger: Logger
): express.Router {
    const router = express.Router();

    router.post("/api/sessions/password", async (req, res) => {});

    router.delete("/api/sessions", async (req, res) => {});

    router.get("/api/sessions", async (req, res) => {});

    return router;
}

injected(getSessionsRouter, USER_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const SESSIONS_ROUTER_TOKEN = token<express.Router>("SessionsRouter");
