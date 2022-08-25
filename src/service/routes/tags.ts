import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import {
    UserTagManagementOperator,
    USER_TAG_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/user_tags";
import {
    AuthMiddlewareFactory,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    checkUserHasUserPermission,
    checkUserIsDisabled,
} from "../utils";

const USER_TAGS_MANAGE_PERMISSION = "user_tags.manage";
const USER_DISABLED_TAG = "disabled";
const DEFAULT_GET_USER_TAG_LIST_LIMIT = 10;

export function getUserTagsRouter(
    userTagManagementOperator: UserTagManagementOperator,
    authMiddlewareFactory: AuthMiddlewareFactory
): express.Router {
    const router = express.Router();

    const userLoggedInAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(
        () => true,
        true
    );
    const userDisabledAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(
        (authUserInfo) =>
            checkUserIsDisabled(
                authUserInfo.userTagList,
                USER_DISABLED_TAG
            ),
            true
    );
    const userTagsManageAuthMiddleware =
        authMiddlewareFactory.getAuthMiddleware(
            (authUserInfo) =>
                checkUserHasUserPermission(
                    authUserInfo.userPermissionList,
                    USER_TAGS_MANAGE_PERMISSION
                ),
            true
        );

    router.post(
        "/api/tags",
        userLoggedInAuthMiddleware,
        userDisabledAuthMiddleware,
        userTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const displayName = req.body.display_name as string;
            const description = req.body.description as string;
            const userTag = await userTagManagementOperator.createUserTag(
                displayName,
                description
            );
            res.json(userTag);
        })
    );

    router.get(
        "/api/tags",
        userLoggedInAuthMiddleware,
        userDisabledAuthMiddleware,
        userTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const offset = +(req.query.offset || 0);
            const limit = +(
                req.query.limit || DEFAULT_GET_USER_TAG_LIST_LIMIT
            );
            const sortOrder = +(req.query.sort_order || 0);
            const { totalUserTagCount, userTagList } =
                await userTagManagementOperator.getUserTagList(
                    offset,
                    limit,
                    sortOrder
                );
            res.json({
                total_user_tag_count: totalUserTagCount,
                user_tag_list: userTagList,
            });
        })
    );

    router.patch(
        "/api/tags/:userTagId",
        userLoggedInAuthMiddleware,
        userDisabledAuthMiddleware,
        userTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const userTagId = +req.params.userTagId;
            const displayName = req.body.display_name as string | undefined;
            const description = req.body.description as string | undefined;
            const userTag = await userTagManagementOperator.updateUserTag(
                userTagId,
                displayName,
                description
            );
            res.json(userTag);
        })
    );

    router.delete(
        "/api/tags/:userTagId",
        userLoggedInAuthMiddleware,
        userDisabledAuthMiddleware,
        userTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const userTagId = +req.params.userTagId;
            await userTagManagementOperator.deleteUserTag(userTagId);
            res.json({});
        })
    );

    return router;
}

injected(
    getUserTagsRouter,
    USER_TAG_MANAGEMENT_OPERATOR_TOKEN,
    AUTH_MIDDLEWARE_FACTORY_TOKEN
);

export const USER_TAGS_ROUTER_TOKEN = token<express.Router>("UserTagsRouter");
