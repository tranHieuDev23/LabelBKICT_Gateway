import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import { ImageTagManagementOperator, IMAGE_TAG_MANAGEMENT_OPERATOR_TOKEN } from "../../module/image_tags";
import { AuthMiddlewareFactory, AUTH_MIDDLEWARE_FACTORY_TOKEN, checkUserHasUserPermission } from "../utils";

const IMAGE_TAGS_MANAGE_PERMISSION = "image_tags.manage";

export function getImageTagGroupsRouter(
    imageTagManagementOperator: ImageTagManagementOperator,
    authMiddlewareFactory: AuthMiddlewareFactory
): express.Router {
    const router = express.Router();

    const userLoggedInAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(() => true, true);
    const imageTagsManageAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(
        (authUserInfo) => checkUserHasUserPermission(authUserInfo.userPermissionList, IMAGE_TAGS_MANAGE_PERMISSION),
        true
    );

    router.post(
        "/api/image-tag-groups",
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const displayName = req.body.display_name;
            const isSingleValue = req.body.is_single_value;
            const imageTagGroup = await imageTagManagementOperator.createImageTagGroup(displayName, isSingleValue);
            res.json(imageTagGroup);
        })
    );

    router.get(
        "/api/image-tag-groups",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const withImageTag = +(req.query.with_image_tag || 0) === 1;
            const withImageType = +(req.query.with_image_type || 0) === 1;
            const withClassificationType = +(req.query.with_classification_type || 0) === 1;
            const { imageTagGroupList, imageTagList, imageTypeList, classificationTypeList } =
                await imageTagManagementOperator.getImageTagGroupList(withImageTag, withImageType, withClassificationType);
            const responseBody: any = {
                image_tag_group_list: imageTagGroupList,
            };
            if (withImageTag) {
                responseBody["image_tag_list"] = imageTagList;
            }
            if (withImageType) {
                responseBody["image_type_list"] = imageTypeList;
            }
            if (withClassificationType) {
                responseBody["classification_type_list"] = classificationTypeList;
            }

            res.json(responseBody);
        })
    );

    router.patch(
        "/api/image-tag-groups/:imageTagGroupId",
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupId = +req.params.imageTagGroupId;
            const displayName = req.body.display_name;
            const isSingleValue = req.body.is_single_value;
            const imageType = await imageTagManagementOperator.updateImageTagGroup(
                imageTagGroupId,
                displayName,
                isSingleValue
            );
            res.json(imageType);
        })
    );

    router.delete(
        "/api/image-tag-groups/:imageTagGroupId",
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupId = +req.params.imageTagGroupId;
            await imageTagManagementOperator.deleteImageTagGroup(imageTagGroupId);
            res.json({});
        })
    );

    router.post(
        "/api/image-tag-groups/:imageTagGroupId/tags",
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupId = +req.params.imageTagGroupId;
            const displayName = req.body.display_name;
            const imageTag = await imageTagManagementOperator.addImageTagToImageTagGroup(imageTagGroupId, displayName);
            res.json(imageTag);
        })
    );

    router.patch(
        "/api/image-tag-groups/:imageTagGroupId/tags/:imageTagId",
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupId = +req.params.imageTagGroupId;
            const imageTagId = +req.params.imageTagId;
            const displayName = req.body.display_name;
            const imageTag = await imageTagManagementOperator.updateImageTagOfImageTagGroup(
                imageTagGroupId,
                imageTagId,
                displayName
            );
            res.json(imageTag);
        })
    );

    router.delete(
        "/api/image-tag-groups/:imageTagGroupId/tags/:imageTagId",
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupId = +req.params.imageTagGroupId;
            const imageTagId = +req.params.imageTagId;
            await imageTagManagementOperator.removeImageTagFromImageTagGroup(imageTagGroupId, imageTagId);
            res.json({});
        })
    );

    router.post(
        "/api/image-tag-groups/:imageTagGroupId/image-types",
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupId = +req.params.imageTagGroupId;
            const imageTypeId = +req.body.image_type_id;
            const imageTag = await imageTagManagementOperator.addImageTypeToImageTagGroup(imageTagGroupId, imageTypeId);
            res.json(imageTag);
        })
    );

    router.delete(
        "/api/image-tag-groups/:imageTagGroupId/image-types/:imageTypeId",
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupId = +req.params.imageTagGroupId;
            const imageTypeId = +req.params.imageTypeId;
            await imageTagManagementOperator.removeImageTypeFromImageTagGroup(imageTagGroupId, imageTypeId);
            res.json({});
        })
    );

    router.post(
        "/api/image-tag-groups/:imageTagGroupId/classification-types",
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupId = +req.params.imageTagGroupId;
            const classificationTypeId = +req.body.classification_type_id;
            const imageTag = await imageTagManagementOperator.addClassificationTypeToImageTagGroup(imageTagGroupId, classificationTypeId);
            res.json(imageTag);
        })
    );

    router.delete(
        "/api/image-tag-groups/:imageTagGroupId/classification-types/:classificationTypeId",
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTagGroupId = +req.params.imageTagGroupId;
            const classificationTypeId = +req.params.classificationTypeId;
            await imageTagManagementOperator.removeClassificationTypeFromImageTagGroup(imageTagGroupId, classificationTypeId);
            res.json({});
        })
    );

    return router;
}

injected(getImageTagGroupsRouter, IMAGE_TAG_MANAGEMENT_OPERATOR_TOKEN, AUTH_MIDDLEWARE_FACTORY_TOKEN);

export const IMAGE_TAG_GROUPS_ROUTER_TOKEN = token<express.Router>("ImageTagGroupsRouter");
