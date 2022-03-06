import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import {
    UserRoleManagementOperator,
    USER_ROLE_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/user_roles";
import {
    AuthMiddlewareFactory,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    checkUserHasUserPermission,
} from "../utils";

const USER_ROLES_READ_PERMISSION = "user_roles.read";
const USER_ROLES_WRITE_PERMISSION = "user_roles.write";
const DEFAULT_GET_USER_ROLE_LIST_LIMIT = 10;

export function getUserRolesRouter(
    userRoleManagementOperator: UserRoleManagementOperator,
    authMiddlewareFactory: AuthMiddlewareFactory
): express.Router {
    const router = express.Router();

    router.post(
        "/api/roles",
        authMiddlewareFactory.getAuthMiddleware(
            (authUserInfo) =>
                checkUserHasUserPermission(
                    authUserInfo.userPermissionList,
                    USER_ROLES_WRITE_PERMISSION
                ),
            true
        ),
        asyncHandler(async (req, res) => {
            const displayName = req.body.display_name as string;
            const description = req.body.description as string;
            const userRole = await userRoleManagementOperator.createUserRole(
                displayName,
                description
            );
            res.json({
                id: userRole.id,
                display_name: userRole.displayName,
                description: userRole.description,
            });
        })
    );

    router.get(
        "/api/roles",
        authMiddlewareFactory.getAuthMiddleware(
            (authUserInfo) =>
                checkUserHasUserPermission(
                    authUserInfo.userPermissionList,
                    USER_ROLES_READ_PERMISSION
                ),
            true
        ),
        asyncHandler(async (req, res) => {
            const offset = +req.body.offset || 0;
            const limit = +req.body.limit || DEFAULT_GET_USER_ROLE_LIST_LIMIT;
            const sortOrder = +req.body.sort_order || 0;
            const withUserPermission =
                (req.body.with_user_permission as boolean) || false;
            const { totalUserRoleCount, userRoleList, userPermissionList } =
                await userRoleManagementOperator.getUserRoleList(
                    offset,
                    limit,
                    sortOrder,
                    withUserPermission
                );
            if (withUserPermission) {
                res.json({
                    totalUserRoleCount,
                    userRoleList,
                    userPermissionList,
                });
            } else {
                res.json({
                    totalUserRoleCount,
                    userRoleList,
                });
            }
        })
    );

    router.patch(
        "/api/roles/:userRoleID",
        authMiddlewareFactory.getAuthMiddleware(
            (authUserInfo) =>
                checkUserHasUserPermission(
                    authUserInfo.userPermissionList,
                    USER_ROLES_WRITE_PERMISSION
                ),
            true
        ),
        asyncHandler(async (req, res) => {
            const userRoleID = +req.params.userRoleID;
            const displayName = req.body.display_name as string | undefined;
            const description = req.body.description as string | undefined;
            const userRole = await userRoleManagementOperator.updateUserRole(
                userRoleID,
                displayName,
                description
            );
            res.json({
                id: userRole.id,
                display_name: userRole.displayName,
                description: userRole.description,
            });
        })
    );

    router.delete(
        "/api/roles/:userRoleID",
        authMiddlewareFactory.getAuthMiddleware(
            (authUserInfo) =>
                checkUserHasUserPermission(
                    authUserInfo.userPermissionList,
                    USER_ROLES_WRITE_PERMISSION
                ),
            true
        ),
        asyncHandler(async (req, res) => {
            const userRoleID = +req.params.userRoleID;
            await userRoleManagementOperator.deleteUserRole(userRoleID);
            res.json({});
        })
    );

    router.post("/api/roles/:userID/permissions", async (req, res) => {});

    router.delete(
        "/api/roles/:userID/permissions/:userPermissionID",
        async (req, res) => {}
    );

    return router;
}

injected(
    getUserRolesRouter,
    USER_ROLE_MANAGEMENT_OPERATOR_TOKEN,
    AUTH_MIDDLEWARE_FACTORY_TOKEN
);

export const USER_ROLES_ROUTER_TOKEN = token<express.Router>("UserRolesRouter");
