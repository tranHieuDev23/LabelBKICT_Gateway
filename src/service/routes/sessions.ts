import { injected, token } from "brandi";
import express, { Request } from "express";
import asyncHandler from "express-async-handler";
import {
    ImageListFilterOptions,
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
    getIDListFromQueryParam,
    LABEL_BKICT_AUTH_COOKIE_NAME,
} from "../utils";

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
            res.cookie(LABEL_BKICT_AUTH_COOKIE_NAME, token).json({
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

    function getImageListFilterOptionsFromRequest(
        req: Request
    ): ImageListFilterOptions {
        const filterOptions = new ImageListFilterOptions();
        filterOptions.imageTypeIDList =
            req.query.filter_image_types === undefined
                ? []
                : (req.query.filter_image_types as string[]).map(
                      (item) => +item
                  );
        filterOptions.imageTagIDList = getIDListFromQueryParam(
            req.query.filter_image_tags
        );
        filterOptions.regionLabelIDList = getIDListFromQueryParam(
            req.query.filter_region_labels
        );
        filterOptions.uploadedByUserIDList = getIDListFromQueryParam(
            req.query.filter_uploaded_by_user_ids
        );
        filterOptions.publishedByUserIDList = getIDListFromQueryParam(
            req.query.filter_published_by_user_ids
        );
        filterOptions.verifiedByUserIDList = getIDListFromQueryParam(
            req.query.filter_verified_by_user_ids
        );
        filterOptions.uploadTimeStart = +(
            req.query.filter_upload_time_start || 0
        );
        filterOptions.uploadTimeEnd = +(req.query.filter_upload_time_end || 0);
        filterOptions.publishTimeStart = +(
            req.query.filter_publish_time_start || 0
        );
        filterOptions.publishTimeEnd = +(
            req.query.filter_publish_time_end || 0
        );
        filterOptions.verifyTimeStart = +(
            req.query.filter_verify_time_start || 0
        );
        filterOptions.verifyTimeEnd = +(req.query.filter_verify_time_end || 0);
        filterOptions.originalFileNameQuery = `${
            req.query.original_file_name_query || ""
        }`;
        filterOptions.imageStatusList = getIDListFromQueryParam(
            req.query.filter_image_statuses
        );
        filterOptions.mustMatchAllImageTags =
            +(req.query.must_match_all_image_tags || 0) === 1;
        filterOptions.mustMatchAllRegionLabels =
            +(req.query.must_match_all_region_labels || 0) === 1;
        return filterOptions;
    }

    router.get(
        "/api/sessions/user/images",
        imagesManageSelfAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInformation = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const offset = +(req.query.offset || 0);
            const limit = +(req.query.limit || DEFAULT_GET_IMAGE_LIST_LIMIT);
            const sortOrder = +(req.query.sort_order || 0);
            const filterOptions = getImageListFilterOptionsFromRequest(req);
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
                await imageListManagementOperator.getUserManageableImageUserList(
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
            const filterOptions = getImageListFilterOptionsFromRequest(req);
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
                await imageListManagementOperator.getUserVerifiableImageUserList(
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
            const filterOptions = getImageListFilterOptionsFromRequest(req);
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
        "/api/sessions/user/manageable-image-users",
        imagesExportAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInformation = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const query = `${req.query.query}`;
            const limit = +(req.query.limit || DEFAULT_GET_USER_LIST_LIMIT);
            const userList =
                await imageListManagementOperator.getUserExportableImageUserList(
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
            const filterOptions = getImageListFilterOptionsFromRequest(req);
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
