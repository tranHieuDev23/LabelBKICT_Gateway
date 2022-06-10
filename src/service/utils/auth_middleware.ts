import { injected, token } from "brandi";
import { CookieOptions, Request, RequestHandler } from "express";
import asyncHandler from "express-async-handler";
import httpStatus from "http-status";
import { User, UserPermission, UserRole } from "../../module/schemas";
import {
    SessionManagementOperator,
    SESSION_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/sessions";
import { ErrorWithHTTPCode } from "../../utils";
import { getCookieOptions } from "./cookie";

export class AuthenticatedUserInformation {
    constructor(
        public readonly user: User,
        public readonly userRoleList: UserRole[],
        public readonly userPermissionList: UserPermission[],
        public readonly token: string
    ) {}
}

export declare type AuthorizationFunc = (
    authUserInfo: AuthenticatedUserInformation,
    request: Request
) => boolean;

export interface AuthMiddlewareFactory {
    getAuthMiddleware(
        authorizationFunc: AuthorizationFunc,
        shouldRenewToken: boolean
    ): RequestHandler;
}

export const LABEL_BKICT_AUTH_COOKIE_NAME = "LABEL_BKICT_AUTH";

export class AuthMiddlewareFactoryImpl implements AuthMiddlewareFactory {
    constructor(
        private readonly sessionsManagementOperator: SessionManagementOperator
    ) {}

    public getAuthMiddleware(
        authorizationFunc: AuthorizationFunc,
        shouldRenewToken: boolean
    ): RequestHandler {
        return asyncHandler(async (request, response, next) => {
            const token = request.cookies[LABEL_BKICT_AUTH_COOKIE_NAME] as
                | string
                | undefined;
            if (token === undefined) {
                throw new ErrorWithHTTPCode(
                    "user is not logged in",
                    httpStatus.UNAUTHORIZED
                );
            }

            let user: User;
            let userRoleList: UserRole[];
            let userPermissionList: UserPermission[];
            let newToken: string | null;

            try {
                const userFromSession =
                    await this.sessionsManagementOperator.getUserOfSession(
                        token
                    );
                user = userFromSession.user;
                userRoleList = userFromSession.userRoleList;
                userPermissionList = userFromSession.userPermissionList;
                newToken = userFromSession.newToken;
            } catch (e) {
                if (
                    e instanceof ErrorWithHTTPCode &&
                    e.code === httpStatus.UNAUTHORIZED
                ) {
                    response.clearCookie(LABEL_BKICT_AUTH_COOKIE_NAME);
                }
                throw e;
            }

            const authenticatedUserInformation =
                new AuthenticatedUserInformation(
                    user,
                    userRoleList,
                    userPermissionList,
                    token
                );
            const isUserAuthorized = authorizationFunc(
                authenticatedUserInformation,
                request
            );
            if (!isUserAuthorized) {
                throw new ErrorWithHTTPCode(
                    "user is not authorized to perform the operation",
                    httpStatus.FORBIDDEN
                );
            }

            response.locals.authenticatedUserInformation =
                authenticatedUserInformation;
            if (newToken !== null && shouldRenewToken) {
                response.cookie(
                    LABEL_BKICT_AUTH_COOKIE_NAME,
                    newToken,
                    getCookieOptions()
                );
            }

            next();
        });
    }
}

injected(AuthMiddlewareFactoryImpl, SESSION_MANAGEMENT_OPERATOR_TOKEN);

export const AUTH_MIDDLEWARE_FACTORY_TOKEN = token<AuthMiddlewareFactory>(
    "AuthMiddlewareFactory"
);
