import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import {
    ImageTagManagementOperator,
    IMAGE_TAG_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/image_tags";
import {
    AuthMiddlewareFactory,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    checkUserHasUserPermission,
    CheckUserDisabledMiddlewareFactory,
    CHECK_USER_DISABLED_MIDDLEWARE_FACTORY_TOKEN
} from "../utils";

const IMAGE_TAGS_MANAGE_PERMISSION = "image_tags.manage";

export function getImageTagGroupsRouter(
    imageTagManagementOperator: ImageTagManagementOperator,
    authMiddlewareFactory: AuthMiddlewareFactory,
    checkUserDisabledMiddlewareFactory: CheckUserDisabledMiddlewareFactory
): express.Router {
    const router = express.Router();

    const userLoggedInAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(
        () => true,
        true
    );
    const checkUserDisabledMiddleware = checkUserDisabledMiddlewareFactory.checkUserIsDisabled();
    const imageTagsManageAuthMiddleware =
        authMiddlewareFactory.getAuthMiddleware(
            (authUserInfo) =>
                checkUserHasUserPermission(
                    authUserInfo.userPermissionList,
                    IMAGE_TAGS_MANAGE_PERMISSION
                ),
            true
        );

    router.post(
        "/api/image-tag-groups",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const displayName = req.body.display_name;
            const isSingleValue = req.body.is_single_value;
            const imageTagGroup =
                await imageTagManagementOperator.createImageTagGroup(
                    displayName,
                    isSingleValue
                );
            res.json(imageTagGroup);
        })
    );

    router.get(
        "/api/image-tag-groups",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        asyncHandler(async (req, res) => {
            const withImageTag = +(req.query.with_image_tag || 0) === 1;
            const withImageType = +(req.query.with_image_type || 0) === 1;
            const { imageTagGroupList, imageTagList, imageTypeList } =
                await imageTagManagementOperator.getImageTagGroupList(
                    withImageTag,
                    withImageType
                );
            const responseBody: any = {
                image_tag_group_list: imageTagGroupList,
            };
            if (withImageTag) {
                responseBody["image_tag_list"] = imageTagList;
            }
            if (withImageType) {
                responseBody["image_type_list"] = imageTypeList;
            }
            res.json(responseBody);
        })
    );

    router.patch(
        "/api/image-tag-groups/:imageTagGroupId",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupId = +req.params.imageTagGroupId;
            const displayName = req.body.display_name;
            const isSingleValue = req.body.is_single_value;
            const imageType =
                await imageTagManagementOperator.updateImageTagGroup(
                    imageTagGroupId,
                    displayName,
                    isSingleValue
                );
            res.json(imageType);
        })
    );

    router.delete(
        "/api/image-tag-groups/:imageTagGroupId",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupId = +req.params.imageTagGroupId;
            await imageTagManagementOperator.deleteImageTagGroup(
                imageTagGroupId
            );
            res.json({});
        })
    );

    router.post(
        "/api/image-tag-groups/:imageTagGroupId/tags",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupId = +req.params.imageTagGroupId;
            const displayName = req.body.display_name;
            const imageTag =
                await imageTagManagementOperator.addImageTagToImageTagGroup(
                    imageTagGroupId,
                    displayName
                );
            res.json(imageTag);
        })
    );

    router.patch(
        "/api/image-tag-groups/:imageTagGroupId/tags/:imageTagId",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupId = +req.params.imageTagGroupId;
            const imageTagId = +req.params.imageTagId;
            const displayName = req.body.display_name;
            const imageTag =
                await imageTagManagementOperator.updateImageTagOfImageTagGroup(
                    imageTagGroupId,
                    imageTagId,
                    displayName
                );
            res.json(imageTag);
        })
    );

    router.delete(
        "/api/image-tag-groups/:imageTagGroupId/tags/:imageTagId",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupId = +req.params.imageTagGroupId;
            const imageTagId = +req.params.imageTagId;
            await imageTagManagementOperator.removeImageTagFromImageTagGroup(
                imageTagGroupId,
                imageTagId
            );
            res.json({});
        })
    );

    router.post(
        "/api/image-tag-groups/:imageTagGroupId/image-types",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupId = +req.params.imageTagGroupId;
            const imageTypeId = +req.body.image_type_id;
            const imageTag =
                await imageTagManagementOperator.addImageTypeToImageTagGroup(
                    imageTagGroupId,
                    imageTypeId
                );
            res.json(imageTag);
        })
    );

    router.delete(
        "/api/image-tag-groups/:imageTagGroupId/image-types/:imageTypeId",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupId = +req.params.imageTagGroupId;
            const imageTypeId = +req.params.imageTypeId;
            await imageTagManagementOperator.removeImageTypeFromImageTagGroup(
                imageTagGroupId,
                imageTypeId
            );
            res.json({});
        })
    );

    return router;
}

injected(
    getImageTagGroupsRouter,
    IMAGE_TAG_MANAGEMENT_OPERATOR_TOKEN,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    CHECK_USER_DISABLED_MIDDLEWARE_FACTORY_TOKEN
);

export const IMAGE_TAG_GROUPS_ROUTER_TOKEN = token<express.Router>(
    "ImageTagGroupsRouter"
);
