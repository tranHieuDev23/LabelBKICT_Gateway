import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import {
    ImageTypeManagementOperator,
    IMAGE_TYPE_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/image_types";
import {
    AuthMiddlewareFactory,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    checkUserHasUserPermission,
} from "../utils";

const IMAGE_TYPES_MANAGE_PERMISSION = "image_types.manage";

export function getImageTypesRouter(
    imageTypeManagementOperator: ImageTypeManagementOperator,
    authMiddlewareFactory: AuthMiddlewareFactory
): express.Router {
    const router = express.Router();

    const imageTypesManageAuthMiddleware =
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
        imageTypesManageAuthMiddleware,
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

    router.patch(
        "/api/image-types/:imageTypeID",
        imageTypesManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTypeID = +req.params.imageTypeID;
            const displayName = req.body.display_name;
            const hasPredictiveModel = req.body.has_predictive_model;
            const imageType = await imageTypeManagementOperator.updateImageType(
                imageTypeID,
                displayName,
                hasPredictiveModel
            );
            res.json(imageType);
        })
    );

    router.delete(
        "/api/image-types/:imageTypeID",
        imageTypesManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTypeID = +req.params.imageTypeID;
            await imageTypeManagementOperator.deleteImageType(imageTypeID);
            res.json({});
        })
    );

    router.post(
        "/api/image-types/:imageTypeID/labels",
        imageTypesManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTypeID = +req.params.imageTypeID;
            const displayName = req.body.display_name;
            const color = req.body.color;
            const regionLabel =
                await imageTypeManagementOperator.addRegionLabelToImageType(
                    imageTypeID,
                    displayName,
                    color
                );
            res.json(regionLabel);
        })
    );

    router.patch(
        "/api/image-types/:imageTypeID/labels/:regionLabelID",
        imageTypesManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTypeID = +req.params.imageTypeID;
            const regionLabelID = +req.params.regionLabelID;
            const displayName = req.body.display_name;
            const color = req.body.color;
            const regionLabel =
                await imageTypeManagementOperator.updateRegionLabelOfImageType(
                    imageTypeID,
                    regionLabelID,
                    displayName,
                    color
                );
            res.json(regionLabel);
        })
    );

    router.delete(
        "/api/image-types/:imageTypeID/labels/:regionLabelID",
        imageTypesManageAuthMiddleware,
        asyncHandler(async (req, res) => {
            const imageTypeID = +req.params.imageTypeID;
            const regionLabelID = +req.params.regionLabelID;
            await imageTypeManagementOperator.removeRegionLabelFromImageType(
                imageTypeID,
                regionLabelID
            );
            res.json({});
        })
    );

    return router;
}

injected(
    getImageTypesRouter,
    IMAGE_TYPE_MANAGEMENT_OPERATOR_TOKEN,
    AUTH_MIDDLEWARE_FACTORY_TOKEN
);

export const IMAGE_TYPES_ROUTER_TOKEN =
    token<express.Router>("ImageTypesRouter");
