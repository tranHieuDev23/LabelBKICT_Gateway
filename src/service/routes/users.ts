import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import {
    UserManagementOperator,
    USER_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/users";
import {
    AuthMiddlewareFactory,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    checkUserHasUserPermission,
} from "../utils";

export function getUsersRouter(
    userManagementOperator: UserManagementOperator,
    authMiddlewareFactory: AuthMiddlewareFactory
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

    router.get(
        "/api/users",
        asyncHandler(async (req, res) => {
            const offset = req.body.offset as number;
            const limit = req.body.limit as number;
            const sortOrder = req.body.sort_order as number;
            const withUserRole = req.body.with_user_role as boolean;
            const { totalUserCount, userList, userRoleList } =
                await userManagementOperator.getUserList(
                    offset,
                    limit,
                    sortOrder,
                    withUserRole
                );
            if (withUserRole) {
                res.json({
                    total_user_count: totalUserCount,
                    user_list: userList,
                    user_role_list: userRoleList,
                });
            } else {
                res.json({
                    total_user_count: totalUserCount,
                    user_list: userList,
                });
            }
        })
    );

    router.patch(
        "/api/users/:userID",
        authMiddlewareFactory.getAuthMiddleware((authUserInfo, request) => {
            const userID = +request.params.userID;
            if (authUserInfo.user.id === userID) {
                return true;
            }
            return checkUserHasUserPermission(
                authUserInfo.userPermissionList,
                "users.write"
            );
        }, true),
        asyncHandler(async (req, res) => {
            const userID = +req.params.userID;
            const username = req.body.username as string | undefined;
            const displayName = req.body.display_name as string | undefined;
            const password = req.body.password as string | undefined;
            const user = await userManagementOperator.updateUser(
                userID,
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

    router.post(
        "/api/users/:userID/roles",
        asyncHandler(async (req, res) => {})
    );

    router.delete(
        "/api/users/:userID/roles/:userRoleID",
        asyncHandler(async (req, res) => {})
    );

    return router;
}

injected(
    getUsersRouter,
    USER_MANAGEMENT_OPERATOR_TOKEN,
    AUTH_MIDDLEWARE_FACTORY_TOKEN
);

export const USERS_ROUTER_TOKEN = token<express.Router>("UsersRouter");
