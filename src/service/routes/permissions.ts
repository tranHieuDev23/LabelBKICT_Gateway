import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import {
    UserPermissionManagementOperator,
    USER_PERMISSION_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/user_permissions";
import {
    AuthMiddlewareFactory,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    checkUserHasUserPermission,
} from "../utils";

const USER_PERMISSIONS_READ_PERMISSION = "user_permissions.read";
const USER_PERMISSIONS_WRITE_PERMISSION = "user_permissions.write";

export function getUserPermissionsRouter(
    userPermissionManagementOperator: UserPermissionManagementOperator,
    authMiddlewareFactory: AuthMiddlewareFactory
): express.Router {
    const router = express.Router();

    const userPermissionsReadAuthMiddleware =
        authMiddlewareFactory.getAuthMiddleware(
            (authUserInfo) =>
                checkUserHasUserPermission(
                    authUserInfo.userPermissionList,
                    USER_PERMISSIONS_READ_PERMISSION
                ),
            true
        );
    const userPermissionsWriteAuthMiddleware =
        authMiddlewareFactory.getAuthMiddleware(
            (authUserInfo) =>
                checkUserHasUserPermission(
                    authUserInfo.userPermissionList,
                    USER_PERMISSIONS_WRITE_PERMISSION
                ),
            true
        );

    router.post(
        "/api/permissions",
        userPermissionsWriteAuthMiddleware,
        asyncHandler(async (req, res) => {
            const permissionName = req.body.permission_name as string;
            const description = req.body.description as string;
            const userPermission =
                await userPermissionManagementOperator.createUserPermission(
                    permissionName,
                    description
                );
            res.json(userPermission);
        })
    );

    router.get(
        "/api/permissions",
        userPermissionsReadAuthMiddleware,
        asyncHandler(async (_, res) => {
            const userPermissionList =
                await userPermissionManagementOperator.getUserPermissionList();
            res.json({ user_permission_list: userPermissionList });
        })
    );

    router.patch(
        "/api/permissions/:userPermissionID",
        userPermissionsWriteAuthMiddleware,
        asyncHandler(async (req, res) => {
            const userPermissionID = +req.params.userPermissionID;
            const permissionName = req.body.permission_name as string;
            const description = req.body.description as string;
            const userPermission =
                await userPermissionManagementOperator.updateUserPermission(
                    userPermissionID,
                    permissionName,
                    description
                );
            res.json(userPermission);
        })
    );

    router.delete(
        "/api/permissions/:userPermissionID",
        userPermissionsWriteAuthMiddleware,
        async (req, res) => {
            const userPermissionID = +req.params.userPermissionID;
            await userPermissionManagementOperator.deleteUserPermission(
                userPermissionID
            );
            res.json({});
        }
    );

    return router;
}

injected(
    getUserPermissionsRouter,
    USER_PERMISSION_MANAGEMENT_OPERATOR_TOKEN,
    AUTH_MIDDLEWARE_FACTORY_TOKEN
);

export const USER_PERMISSIONS_ROUTER_TOKEN = token<express.Router>(
    "UserPermissionsRouter"
);
