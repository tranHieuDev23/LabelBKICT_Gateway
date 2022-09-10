import { injected, token } from "brandi";
import { RequestHandler } from "express";
import asyncHandler from "express-async-handler";
import httpStatus from "http-status";
import { UserTag } from "../../module/schemas";
import { 
    SessionManagementOperator, 
    SESSION_MANAGEMENT_OPERATOR_TOKEN 
} from "../../module/sessions";
import { ErrorWithHTTPCode } from "../../utils";
import { LABEL_BKICT_AUTH_COOKIE_NAME } from "./auth_middleware";

const USER_TAG_DISABLED_DISPLAY_NAME = "Disabled";

export interface CheckUserDisabledMiddlewareFactory {
    checkUserIsDisabled(): RequestHandler;
}

export class CheckUserDisabledMiddlewareFactoryImpl implements CheckUserDisabledMiddlewareFactory {
    constructor(
        private readonly sessionManagementOperator: SessionManagementOperator
    ) {}

    public checkUserIsDisabled(): RequestHandler {
        return asyncHandler(async (request, response, next) => {
            const token = request.cookies[LABEL_BKICT_AUTH_COOKIE_NAME] as
                | string
                | undefined;
            if (token == undefined) {
                throw new ErrorWithHTTPCode(
                    "user is not logged in",
                    httpStatus.UNAUTHORIZED
                );
            }
    
            let userTagList: UserTag[];
    
            try {
                const userFromSession = 
                    await this.sessionManagementOperator.getUserOfSession(
                        token
                    );
                userTagList = userFromSession.userTagList;
            } catch (e) {
                if (
                    e instanceof ErrorWithHTTPCode &&
                    e.code === httpStatus.UNAUTHORIZED
                ) {
                    response.clearCookie(LABEL_BKICT_AUTH_COOKIE_NAME);
                }
                throw e;
            }

            for (let userTag of userTagList) {
                if (userTag.display_name == USER_TAG_DISABLED_DISPLAY_NAME) {
                    throw new ErrorWithHTTPCode(
                        "user is disabled",
                        httpStatus.FORBIDDEN
                    );
                }
            }
            next();
        });
    }
}

injected(CheckUserDisabledMiddlewareFactoryImpl, SESSION_MANAGEMENT_OPERATOR_TOKEN);

export const CHECK_USER_DISABLED_MIDDLEWARE_FACTORY_TOKEN = token<CheckUserDisabledMiddlewareFactory>(
    "CheckUserDisabledMiddlewareFactory"
);