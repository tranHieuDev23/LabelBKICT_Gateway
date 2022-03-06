import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import {
    UserManagementOperator,
    USER_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/users";
import {
    UserRoleManagementOperator,
    USER_ROLE_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/user_roles";
import {
    AuthMiddlewareFactory,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    checkUserHasUserPermission,
} from "../utils";

const USERS_READ_PERMISSION = "users.read";
const USERS_WRITE_PERMISSION = "users.write";
const DEFAULT_GET_USER_ROLE_LIST_LIMIT = 10;

export function getUsersRouter(
    userManagementOperator: UserManagementOperator,
    userRoleManagementOperator: UserRoleManagementOperator,
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
        authMiddlewareFactory.getAuthMiddleware((authUserInfo, request) => {
            const userID = +request.params.userID;
            if (authUserInfo.user.id === userID) {
                return true;
            }
            return checkUserHasUserPermission(
                authUserInfo.userPermissionList,
                USERS_READ_PERMISSION
            );
        }, true),
        asyncHandler(async (req, res) => {
            const offset = +req.body.offset || 0;
            const limit = +req.body.limit || DEFAULT_GET_USER_ROLE_LIST_LIMIT;
            const sortOrder = +req.body.sort_order || 0;
            const withUserRole = (req.body.with_user_role as boolean) || false;
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
                USERS_WRITE_PERMISSION
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
        authMiddlewareFactory.getAuthMiddleware(
            (authUserInfo) =>
                checkUserHasUserPermission(
                    authUserInfo.userPermissionList,
                    USERS_WRITE_PERMISSION
                ),
            true
        ),
        asyncHandler(async (req, res) => {
            const userID = +req.params.userID;
            const userRoleID = +req.body.userRoleID;
            await userRoleManagementOperator.addUserRoleToUser(
                userID,
                userRoleID
            );
            res.json({});
        })
    );

    router.delete(
        "/api/users/:userID/roles/:userRoleID",
        authMiddlewareFactory.getAuthMiddleware(
            (authUserInfo) =>
                checkUserHasUserPermission(
                    authUserInfo.userPermissionList,
                    USERS_WRITE_PERMISSION
                ),
            true
        ),
        asyncHandler(async (req, res) => {
            const userID = +req.params.userID;
            const userRoleID = +req.body.userRoleID;
            await userRoleManagementOperator.removeUserRoleFromUser(
                userID,
                userRoleID
            );
            res.json({});
        })
    );

    return router;
}

injected(
    getUsersRouter,
    USER_MANAGEMENT_OPERATOR_TOKEN,
    USER_ROLE_MANAGEMENT_OPERATOR_TOKEN,
    AUTH_MIDDLEWARE_FACTORY_TOKEN
);

export const USERS_ROUTER_TOKEN = token<express.Router>("UsersRouter");
