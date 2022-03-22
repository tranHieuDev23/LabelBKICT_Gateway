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
} from "../utils";

const IMAGE_TAGS_MANAGE_PERMISSION = "image_tags.manage";

export function getImageTagGroupsRouter(
    imageTagManagementOperator: ImageTagManagementOperator,
    authMiddlewareFactory: AuthMiddlewareFactory
): express.Router {
    const router = express.Router();

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
        "/api/image-tag-groups/:imageTagGroupID",
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupID = +req.params.imageTagGroupID;
            const displayName = req.body.display_name;
            const isSingleValue = req.body.is_single_value;
            const imageType =
                await imageTagManagementOperator.updateImageTagGroup(
                    imageTagGroupID,
                    displayName,
                    isSingleValue
                );
            res.json(imageType);
        })
    );

    router.delete(
        "/api/image-tag-groups/:imageTagGroupID",
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupID = +req.params.imageTagGroupID;
            await imageTagManagementOperator.deleteImageTagGroup(
                imageTagGroupID
            );
            res.json({});
        })
    );

    router.post(
        "/api/image-tag-groups/:imageTagGroupID/tags",
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupID = +req.params.imageTagGroupID;
            const displayName = req.body.display_name;
            const imageTag =
                await imageTagManagementOperator.addImageTagToImageTagGroup(
                    imageTagGroupID,
                    displayName
                );
            res.json(imageTag);
        })
    );

    router.patch(
        "/api/image-tag-groups/:imageTagGroupID/tags/:imageTagID",
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupID = +req.params.imageTagGroupID;
            const imageTagID = +req.params.imageTagID;
            const displayName = req.body.display_name;
            const imageTag =
                await imageTagManagementOperator.updateImageTagOfImageTagGroup(
                    imageTagGroupID,
                    imageTagID,
                    displayName
                );
            res.json(imageTag);
        })
    );

    router.delete(
        "/api/image-tag-groups/:imageTagGroupID/tags/:imageTagID",
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupID = +req.params.imageTagGroupID;
            const imageTagID = +req.params.imageTagID;
            await imageTagManagementOperator.removeImageTagFromImageTagGroup(
                imageTagGroupID,
                imageTagID
            );
            res.json({});
        })
    );

    router.post(
        "/api/image-tag-groups/:imageTagGroupID/types",
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupID = +req.params.imageTagGroupID;
            const imageTypeID = +req.body.image_type_id;
            const imageTag =
                await imageTagManagementOperator.addImageTypeToImageTagGroup(
                    imageTagGroupID,
                    imageTypeID
                );
            res.json(imageTag);
        })
    );

    router.delete(
        "/api/image-tag-groups/:imageTagGroupID/types/:imageTypeID",
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupID = +req.params.imageTagGroupID;
            const imageTypeID = +req.body.image_type_id;
            await imageTagManagementOperator.removeImageTypeFromImageTagGroup(
                imageTagGroupID,
                imageTypeID
            );
            res.json({});
        })
    );

    return router;
}

injected(
    getImageTagGroupsRouter,
    IMAGE_TAG_MANAGEMENT_OPERATOR_TOKEN,
    AUTH_MIDDLEWARE_FACTORY_TOKEN
);

export const IMAGE_TAG_GROUPS_ROUTER_TOKEN = token<express.Router>(
    "ImageTagGroupsRouter"
);
