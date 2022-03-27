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

const USERS_MANAGE_PERMISSION = "users.manage";
const DEFAULT_GET_USER_LIST_LIMIT = 10;

export function getUsersRouter(
    userManagementOperator: UserManagementOperator,
    userRoleManagementOperator: UserRoleManagementOperator,
    authMiddlewareFactory: AuthMiddlewareFactory
): express.Router {
    const router = express.Router();

    const userLoggedInAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(
        () => true,
        true
    );
    const usersManageAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(
        (authUserInfo) =>
            checkUserHasUserPermission(
                authUserInfo.userPermissionList,
                USERS_MANAGE_PERMISSION
            ),
        true
    );
    const sameUserOrUsersManageAuthMiddleware =
        authMiddlewareFactory.getAuthMiddleware((authUserInfo, request) => {
            const userId = +request.params.userId;
            if (authUserInfo.user.id === userId) {
                return true;
            }
            return checkUserHasUserPermission(
                authUserInfo.userPermissionList,
                USERS_MANAGE_PERMISSION
            );
        }, true);

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
            res.json(user);
        })
    );

    router.get(
        "/api/users",
        usersManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const offset = +(req.query.offset || 0);
            const limit = +(req.query.limit || DEFAULT_GET_USER_LIST_LIMIT);
            const sortOrder = +(req.query.sort_order || 0);
            const withUserRole = +(req.query.with_user_role || 0) === 1;
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

    router.get(
        "/api/users/search",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const query = `${req.query.query || ""}`;
            const limit = +(req.query.limit || DEFAULT_GET_USER_LIST_LIMIT);
            const userList = await userManagementOperator.searchUserList(
                query,
                limit
            );
            res.json({
                user_list: userList,
            });
        })
    );

    router.patch(
        "/api/users/:userId",
        sameUserOrUsersManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const userId = +req.params.userId;
            const username = req.body.username as string | undefined;
            const displayName = req.body.display_name as string | undefined;
            const password = req.body.password as string | undefined;
            const user = await userManagementOperator.updateUser(
                userId,
                username,
                displayName,
                password
            );
            res.json(user);
        })
    );

    router.post(
        "/api/users/:userId/roles",
        usersManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const userId = +req.params.userId;
            const userRoleId = +req.body.user_role_id;
            await userRoleManagementOperator.addUserRoleToUser(
                userId,
                userRoleId
            );
            res.json({});
        })
    );

    router.delete(
        "/api/users/:userId/roles/:userRoleId",
        usersManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const userId = +req.params.userId;
            const userRoleId = +req.params.userRoleId;
            await userRoleManagementOperator.removeUserRoleFromUser(
                userId,
                userRoleId
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
