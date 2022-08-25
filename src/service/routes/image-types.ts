import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import {
    ImageTagManagementOperator,
    IMAGE_TAG_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/image_tags";
import {
    ImageTypeManagementOperator,
    IMAGE_TYPE_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/image_types";
import {
    AuthMiddlewareFactory,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    checkUserHasUserPermission,
    checkUserIsDisabled,
} from "../utils";

const IMAGE_TYPES_MANAGE_PERMISSION = "image_types.manage";
const USER_DISABLED_TAG = "disabled";

export function getImageTypesRouter(
    imageTypeManagementOperator: ImageTypeManagementOperator,
    imageTagManagementOperator: ImageTagManagementOperator,
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
    const imageTagsManageAuthMiddleware =
        authMiddlewareFactory.getAuthMiddleware(
            (authUserInfo) =>
                checkUserHasUserPermission(
                    authUserInfo.userPermissionList,
                    IMAGE_TYPES_MANAGE_PERMISSION
                ),
            true
        );

    router.post(
        "/api/image-types",
        userLoggedInAuthMiddleware,
        userDisabledAuthMiddleware,
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const displayName = req.body.display_name;
            const hasPredictiveModel = req.body.has_predictive_model;
            const imageType = await imageTypeManagementOperator.createImageType(
                displayName,
                hasPredictiveModel
            );
            res.json(imageType);
        })
    );

    router.get(
        "/api/image-types",
        userLoggedInAuthMiddleware,
        userDisabledAuthMiddleware,
        asyncHandler(async (req, res) => {
            const withRegionLabel = +(req.query.with_region_label || 0) === 1;
            const { imageTypeList, regionLabelList } =
                await imageTypeManagementOperator.getImageTypeList(
                    withRegionLabel
                );
            res.json({
                image_type_list: imageTypeList,
                region_label_list: regionLabelList,
            });
        })
    );

    router.get(
        "/api/image-types/:imageTypeId",
        userLoggedInAuthMiddleware,
        userDisabledAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTypeId = +req.params.imageTypeId;
            const { imageType, regionLabelList } =
                await imageTypeManagementOperator.getImageType(imageTypeId);
            res.json({
                image_type: imageType,
                region_label_list: regionLabelList,
            });
        })
    );

    router.patch(
        "/api/image-types/:imageTypeId",
        userLoggedInAuthMiddleware,
        userDisabledAuthMiddleware,
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTypeId = +req.params.imageTypeId;
            const displayName = req.body.display_name;
            const hasPredictiveModel = req.body.has_predictive_model;
            const imageType = await imageTypeManagementOperator.updateImageType(
                imageTypeId,
                displayName,
                hasPredictiveModel
            );
            res.json(imageType);
        })
    );

    router.delete(
        "/api/image-types/:imageTypeId",
        userLoggedInAuthMiddleware,
        userDisabledAuthMiddleware,
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTypeId = +req.params.imageTypeId;
            await imageTypeManagementOperator.deleteImageType(imageTypeId);
            res.json({});
        })
    );

    router.post(
        "/api/image-types/:imageTypeId/labels",
        userLoggedInAuthMiddleware,
        userDisabledAuthMiddleware,
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTypeId = +req.params.imageTypeId;
            const displayName = req.body.display_name;
            const color = req.body.color;
            const regionLabel =
                await imageTypeManagementOperator.addRegionLabelToImageType(
                    imageTypeId,
                    displayName,
                    color
                );
            res.json(regionLabel);
        })
    );

    router.patch(
        "/api/image-types/:imageTypeId/labels/:regionLabelId",
        userLoggedInAuthMiddleware,
        userDisabledAuthMiddleware,
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTypeId = +req.params.imageTypeId;
            const regionLabelId = +req.params.regionLabelId;
            const displayName = req.body.display_name;
            const color = req.body.color;
            const regionLabel =
                await imageTypeManagementOperator.updateRegionLabelOfImageType(
                    imageTypeId,
                    regionLabelId,
                    displayName,
                    color
                );
            res.json(regionLabel);
        })
    );

    router.delete(
        "/api/image-types/:imageTypeId/labels/:regionLabelId",
        userLoggedInAuthMiddleware,
        userDisabledAuthMiddleware,
        imageTagsManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTypeId = +req.params.imageTypeId;
            const regionLabelId = +req.params.regionLabelId;
            await imageTypeManagementOperator.removeRegionLabelFromImageType(
                imageTypeId,
                regionLabelId
            );
            res.json({});
        })
    );

    router.get(
        "/api/image-types/:imageTypeId/image-tag-groups",
        userLoggedInAuthMiddleware,
        userDisabledAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTypeId = +req.params.imageTypeId;
            const { imageTagGroupList, imageTagList } =
                await imageTagManagementOperator.getImageTagGroupListOfImageType(
                    imageTypeId
                );
            res.json({
                image_tag_group_list: imageTagGroupList,
                image_tag_list: imageTagList,
            });
        })
    );

    return router;
}

injected(
    getImageTypesRouter,
    IMAGE_TYPE_MANAGEMENT_OPERATOR_TOKEN,
    IMAGE_TAG_MANAGEMENT_OPERATOR_TOKEN,
    AUTH_MIDDLEWARE_FACTORY_TOKEN
);

export const IMAGE_TYPES_ROUTER_TOKEN =
    token<express.Router>("ImageTypesRouter");
