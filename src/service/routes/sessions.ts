import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import {
    ImageListManagementOperator,
    IMAGE_LIST_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/images";
import {
    SessionManagementOperator,
    SESSION_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/sessions";
import {
    AuthenticatedUserInformation,
    AuthMiddlewareFactory,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    checkUserHasUserPermission,
    getCookieOptions,
    LABEL_BKICT_AUTH_COOKIE_NAME,
} from "../utils";
import { getImageListFilterOptionsFromQueryParams } from "./utils";

const IMAGES_MANAGE_SELF_PERMISSION = "images.manage.self";
const IMAGES_MANAGE_ALL_PERMISSION = "images.manage.all";
const IMAGES_VERIFY_PERMISSION = "images.verify";
const IMAGES_EXPORT_PERMISSION = "images.export";
const DEFAULT_GET_IMAGE_LIST_LIMIT = 10;
const DEFAULT_GET_USER_LIST_LIMIT = 10;

export function getSessionsRouter(
    sessionManagementOperator: SessionManagementOperator,
    imageListManagementOperator: ImageListManagementOperator,
    authMiddlewareFactory: AuthMiddlewareFactory
): express.Router {
    const router = express.Router();

    const imagesManageSelfAuthMiddleware =
        authMiddlewareFactory.getAuthMiddleware(
            (authUserInfo) =>
                checkUserHasUserPermission(
                    authUserInfo.userPermissionList,
                    IMAGES_MANAGE_SELF_PERMISSION
                ),
            true
        );

    const imagesManageAllAuthMiddleware =
        authMiddlewareFactory.getAuthMiddleware(
            (authUserInfo) =>
                checkUserHasUserPermission(
                    authUserInfo.userPermissionList,
                    IMAGES_MANAGE_ALL_PERMISSION
                ),
            true
        );

    const imagesVerifyAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(
        (authUserInfo) =>
            checkUserHasUserPermission(
                authUserInfo.userPermissionList,
                IMAGES_VERIFY_PERMISSION
            ),
        true
    );

    const imagesExportAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(
        (authUserInfo) =>
            checkUserHasUserPermission(
                authUserInfo.userPermissionList,
                IMAGES_EXPORT_PERMISSION
            ),
        true
    );

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
            res.cookie(
                LABEL_BKICT_AUTH_COOKIE_NAME,
                token,
                getCookieOptions()
            ).json({
                user: user,
                user_role_list: userRoleList,
                user_permission_list: userPermissionList,
            });
        })
    );

    router.get(
        "/api/sessions/user",
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
        "/api/sessions/user/images",
        imagesManageSelfAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInformation = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const offset = +(req.query.offset || 0);
            const limit = +(req.query.limit || DEFAULT_GET_IMAGE_LIST_LIMIT);
            const sortOrder = +(req.query.sort_order || 0);
            const filterOptions = getImageListFilterOptionsFromQueryParams(
                req.query
            );
            const { totalImageCount, imageList, imageTagList } =
                await imageListManagementOperator.getUserImageList(
                    authenticatedUserInformation,
                    offset,
                    limit,
                    sortOrder,
                    filterOptions
                );
            res.json({
                total_image_count: totalImageCount,
                image_list: imageList,
                image_tag_list: imageTagList,
            });
        })
    );

    router.get(
        "/api/sessions/user/manageable-image-users",
        imagesManageAllAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInformation = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const query = `${req.query.query}`;
            const limit = +(req.query.limit || DEFAULT_GET_USER_LIST_LIMIT);
            const userList =
                await imageListManagementOperator.searchUserManageableImageUserList(
                    authenticatedUserInformation,
                    query,
                    limit
                );
            res.json({ user_list: userList });
        })
    );

    router.get(
        "/api/sessions/user/manageable-images",
        imagesManageAllAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInformation = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const offset = +(req.query.offset || 0);
            const limit = +(req.query.limit || DEFAULT_GET_IMAGE_LIST_LIMIT);
            const sortOrder = +(req.query.sort_order || 0);
            const filterOptions = getImageListFilterOptionsFromQueryParams(
                req.query
            );
            const { totalImageCount, imageList, imageTagList } =
                await imageListManagementOperator.getUserManageableImageList(
                    authenticatedUserInformation,
                    offset,
                    limit,
                    sortOrder,
                    filterOptions
                );
            res.json({
                total_image_count: totalImageCount,
                image_list: imageList,
                image_tag_list: imageTagList,
            });
        })
    );

    router.get(
        "/api/sessions/user/verifiable-image-users",
        imagesVerifyAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInformation = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const query = `${req.query.query}`;
            const limit = +(req.query.limit || DEFAULT_GET_USER_LIST_LIMIT);
            const userList =
                await imageListManagementOperator.searchUserVerifiableImageUserList(
                    authenticatedUserInformation,
                    query,
                    limit
                );
            res.json({ user_list: userList });
        })
    );

    router.get(
        "/api/sessions/user/verifiable-images",
        imagesVerifyAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInformation = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const offset = +(req.query.offset || 0);
            const limit = +(req.query.limit || DEFAULT_GET_IMAGE_LIST_LIMIT);
            const sortOrder = +(req.query.sort_order || 0);
            const filterOptions = getImageListFilterOptionsFromQueryParams(
                req.query
            );
            const { totalImageCount, imageList, imageTagList } =
                await imageListManagementOperator.getUserVerifiableImageList(
                    authenticatedUserInformation,
                    offset,
                    limit,
                    sortOrder,
                    filterOptions
                );
            res.json({
                total_image_count: totalImageCount,
                image_list: imageList,
                image_tag_list: imageTagList,
            });
        })
    );

    router.get(
        "/api/sessions/user/exportable-image-users",
        imagesExportAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInformation = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const query = `${req.query.query}`;
            const limit = +(req.query.limit || DEFAULT_GET_USER_LIST_LIMIT);
            const userList =
                await imageListManagementOperator.searchUserExportableImageUserList(
                    authenticatedUserInformation,
                    query,
                    limit
                );
            res.json({ user_list: userList });
        })
    );

    router.get(
        "/api/sessions/user/exportable-images",
        imagesExportAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInformation = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const offset = +(req.query.offset || 0);
            const limit = +(req.query.limit || DEFAULT_GET_IMAGE_LIST_LIMIT);
            const sortOrder = +(req.query.sort_order || 0);
            const filterOptions = getImageListFilterOptionsFromQueryParams(
                req.query
            );
            const { totalImageCount, imageList, imageTagList } =
                await imageListManagementOperator.getUserExportableImageList(
                    authenticatedUserInformation,
                    offset,
                    limit,
                    sortOrder,
                    filterOptions
                );
            res.json({
                total_image_count: totalImageCount,
                image_list: imageList,
                image_tag_list: imageTagList,
            });
        })
    );

    return router;
}

injected(
    getSessionsRouter,
    SESSION_MANAGEMENT_OPERATOR_TOKEN,
    IMAGE_LIST_MANAGEMENT_OPERATOR_TOKEN,
    AUTH_MIDDLEWARE_FACTORY_TOKEN
);

export const SESSIONS_ROUTER_TOKEN = token<express.Router>("SessionsRouter");
