import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import {
    SessionManagementOperator,
    SESSION_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/sessions";
import {
    AuthenticatedUserInformation,
    AuthMiddlewareFactory,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    LABEL_BKICT_AUTH_COOKIE_NAME,
} from "../utils";

export function getSessionsRouter(
    sessionManagementOperator: SessionManagementOperator,
    authMiddlewareFactory: AuthMiddlewareFactory
): express.Router {
    const router = express.Router();

    router.post(
        "/api/sessions/password",
        asyncHandler(async (req, res) => {
            const username = req.body.username as string;
            const password = req.body.password as string;
            const { user, userRoleList, userPermissionList, token } =
                await sessionManagementOperator.loginWithPassword(
                    username,
                    password
                );
            res.cookie(LABEL_BKICT_AUTH_COOKIE_NAME, token).json({
                user: user,
                user_role_list: userRoleList,
                user_permission_list: userPermissionList,
            });
        })
    );

    router.delete(
        "/api/sessions",
        authMiddlewareFactory.getAuthMiddleware(() => true, false),
        asyncHandler(async (_, res) => {
            const authenticatedUserInformation = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            await sessionManagementOperator.logout(
                authenticatedUserInformation.token
            );
            res.clearCookie(LABEL_BKICT_AUTH_COOKIE_NAME).json({});
        })
    );

    router.get(
        "/api/sessions",
        authMiddlewareFactory.getAuthMiddleware(() => true, true),
        asyncHandler(async (_, res) => {
            const authenticatedUserInformation = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            res.json({
                user: authenticatedUserInformation.user,
                user_role_list: authenticatedUserInformation.userRoleList,
                user_permission_list:
                    authenticatedUserInformation.userPermissionList,
            });
        })
    );

    return router;
}

injected(
    getSessionsRouter,
    SESSION_MANAGEMENT_OPERATOR_TOKEN,
    AUTH_MIDDLEWARE_FACTORY_TOKEN
);

export const SESSIONS_ROUTER_TOKEN = token<express.Router>("SessionsRouter");
