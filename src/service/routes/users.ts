import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import {
    UserManagementOperator,
    USER_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/users";

export function getUsersRouter(
    userManagementOperator: UserManagementOperator
): express.Router {
    const router = express.Router();

    router.post(
        "/api/users",
        asyncHandler(async (req, res) => {
            const username = req.body.username as string;
            const displayName = req.body.display_name as string;
            const password = req.body.password as string;
            const user = await userManagementOperator.createUser(
                username,
                displayName,
                password
            );
            res.json({
                id: user.id,
                username: user.username,
                display_name: user.displayName,
            });
        })
    );

    router.get("/api/users", async (req, res) => {});

    router.patch("/api/users/:userID", async (req, res) => {});

    router.post("/api/users/:userID/roles", async (req, res) => {});

    router.delete(
        "/api/users/:userID/roles/:userRoleID",
        async (req, res) => {}
    );

    return router;
}

injected(getUsersRouter, USER_MANAGEMENT_OPERATOR_TOKEN);

export const USERS_ROUTER_TOKEN = token<express.Router>("UsersRouter");
