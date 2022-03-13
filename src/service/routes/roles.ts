import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import {
    UserPermissionManagementOperator,
    USER_PERMISSION_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/user_permissions";
import {
    UserRoleManagementOperator,
    USER_ROLE_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/user_roles";
import {
    AuthMiddlewareFactory,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    checkUserHasUserPermission,
} from "../utils";

const USER_ROLES_MANAGE_PERMISSION = "user_roles.manage";
const DEFAULT_GET_USER_ROLE_LIST_LIMIT = 10;

export function getUserRolesRouter(
    userRoleManagementOperator: UserRoleManagementOperator,
    userPermissionManagementOperator: UserPermissionManagementOperator,
    authMiddlewareFactory: AuthMiddlewareFactory
): express.Router {
    const router = express.Router();

    const userRolesManageAuthMiddleware =
        authMiddlewareFactory.getAuthMiddleware(
            (authUserInfo) =>
                checkUserHasUserPermission(
                    authUserInfo.userPermissionList,
                    USER_ROLES_MANAGE_PERMISSION
                ),
            true
        );

    router.post(
        "/api/roles",
        userRolesManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const displayName = req.body.display_name as string;
            const description = req.body.description as string;
            const userRole = await userRoleManagementOperator.createUserRole(
                displayName,
                description
            );
            res.json(userRole);
        })
    );

    router.get(
        "/api/roles",
        userRolesManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const offset = +(req.query.offset || 0);
            const limit = +(
                req.query.limit || DEFAULT_GET_USER_ROLE_LIST_LIMIT
            );
            const sortOrder = +(req.query.sort_order || 0);
            const withUserPermission =
                +(req.query.with_user_permission || 0) === 1;
            const { totalUserRoleCount, userRoleList, userPermissionList } =
                await userRoleManagementOperator.getUserRoleList(
                    offset,
                    limit,
                    sortOrder,
                    withUserPermission
                );
            if (withUserPermission) {
                res.json({
                    total_user_role_count: totalUserRoleCount,
                    user_role_list: userRoleList,
                    user_permission_list: userPermissionList,
                });
            } else {
                res.json({
                    total_user_role_count: totalUserRoleCount,
                    user_role_list: userRoleList,
                });
            }
        })
    );

    router.patch(
        "/api/roles/:userRoleID",
        userRolesManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const userRoleID = +req.params.userRoleID;
            const displayName = req.body.display_name as string | undefined;
            const description = req.body.description as string | undefined;
            const userRole = await userRoleManagementOperator.updateUserRole(
                userRoleID,
                displayName,
                description
            );
            res.json(userRole);
        })
    );

    router.delete(
        "/api/roles/:userRoleID",
        userRolesManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const userRoleID = +req.params.userRoleID;
            await userRoleManagementOperator.deleteUserRole(userRoleID);
            res.json({});
        })
    );

    router.post(
        "/api/roles/:userRoleID/permissions",
        userRolesManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const userRoleID = +req.params.userRoleID;
            const userPermissionID = +req.body.user_permission_id;
            await userPermissionManagementOperator.addUserPermissionToUserRole(
                userRoleID,
                userPermissionID
            );
            res.json({});
        })
    );

    router.delete(
        "/api/roles/:userRoleID/permissions/:userPermissionID",
        userRolesManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const userRoleID = +req.params.userRoleID;
            const userPermissionID = +req.params.userPermissionID;
            await userPermissionManagementOperator.removeUserPermissionFromUserRole(
                userRoleID,
                userPermissionID
            );
            res.json({});
        })
    );

    return router;
}

injected(
    getUserRolesRouter,
    USER_ROLE_MANAGEMENT_OPERATOR_TOKEN,
    USER_PERMISSION_MANAGEMENT_OPERATOR_TOKEN,
    AUTH_MIDDLEWARE_FACTORY_TOKEN
);

export const USER_ROLES_ROUTER_TOKEN = token<express.Router>("UserRolesRouter");
