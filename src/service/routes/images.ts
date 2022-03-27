import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import httpStatus from "http-status";
import { Logger } from "winston";
import {
    ImageListManagementOperator,
    ImageManagementOperator,
    IMAGE_LIST_MANAGEMENT_OPERATOR_TOKEN,
    IMAGE_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/images";
import {
    RegionManagementOperator,
    REGION_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/regions";
import { Polygon } from "../../module/schemas";
import { LOGGER_TOKEN } from "../../utils";
import {
    AuthenticatedUserInformation,
    AuthMiddlewareFactory,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    checkUserHasUserPermission,
    getCommaSeparatedIdList,
} from "../utils";

const IMAGES_UPLOAD_PERMISSION = "images.upload";

export function getImagesRouter(
    imageManagementOperator: ImageManagementOperator,
    imageListManagementOperator: ImageListManagementOperator,
    regionManagementOperator: RegionManagementOperator,
    authMiddlewareFactory: AuthMiddlewareFactory
): express.Router {
    const router = express.Router();

    const userLoggedInAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(
        () => true,
        true
    );
    const imagesUploadAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(
        (authUserInfo) =>
            checkUserHasUserPermission(
                authUserInfo.userPermissionList,
                IMAGES_UPLOAD_PERMISSION
            ),
        true
    );

    router.post(
        "/api/images",
        imagesUploadAuthMiddleware,
        asyncHandler(async (req, res) => {
            const fileList = req.files as Express.Multer.File[];

            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageTypeId =
                req.body.image_type_id === undefined ||
                req.body.image_type_id === ""
                    ? undefined
                    : +req.body.image_type_id;
            const imageTagIdList = getCommaSeparatedIdList(
                req.body.image_tag_id_list || ""
            );
            const description = req.body.description || "";
            const originalFileName = fileList[0].originalname;
            const imageData = fileList[0].buffer;

            const image = await imageManagementOperator.createImage(
                authenticatedUserInfo,
                imageTypeId,
                imageTagIdList,
                originalFileName,
                description,
                imageData
            );
            res.json(image);
        })
    );

    router.patch(
        "/api/images",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageIdList = req.body.image_id_list as number[];
            const imageTypeId = +req.body.image_type_id;
            await imageListManagementOperator.updateImageList(
                authenticatedUserInfo,
                imageIdList,
                imageTypeId
            );
            res.json({});
        })
    );

    router.delete(
        "/api/images",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageIdList = req.body.image_id_list as number[];
            await imageListManagementOperator.deleteImageList(
                authenticatedUserInfo,
                imageIdList
            );
            res.json({});
        })
    );

    router.get(
        "/api/images/:imageId",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const { image, imageTagList, regionList } =
                await imageManagementOperator.getImage(
                    authenticatedUserInfo,
                    imageId
                );
            res.json({
                image: image,
                image_tag_list: imageTagList,
                region_list: regionList,
            });
        })
    );

    router.patch(
        "/api/images/:imageId",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const description = req.body.description as string | undefined;
            const image = await imageManagementOperator.updateImageMetadata(
                authenticatedUserInfo,
                imageId,
                description
            );
            res.json(image);
        })
    );

    router.delete(
        "/api/images/:imageId",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            await imageManagementOperator.deleteImage(
                authenticatedUserInfo,
                imageId
            );
            res.json({});
        })
    );

    router.get(
        "/api/images/:imageId/region-snapshot",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const atStatus = +req.body.at_status;
            const regionSnapshotList =
                await imageManagementOperator.getImageRegionSnapshotList(
                    authenticatedUserInfo,
                    imageId,
                    atStatus
                );
            res.json({
                region_list: regionSnapshotList,
            });
        })
    );

    router.patch(
        "/api/images/:imageId/image-type",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const imageTypeId = +(req.body.image_type_id || 0);
            const image = await imageManagementOperator.updateImageType(
                authenticatedUserInfo,
                imageId,
                imageTypeId
            );
            res.json(image);
        })
    );

    router.patch(
        "/api/images/:imageId/status",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const status = +(req.body.status || 0);
            const image = await imageManagementOperator.updateImageStatus(
                authenticatedUserInfo,
                imageId,
                status
            );
            res.json(image);
        })
    );

    router.patch(
        "/api/images/:imageId/tags",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const imageTagId = +(req.body.image_tag_id || 0);
            const image = await imageManagementOperator.addImageTagToImage(
                authenticatedUserInfo,
                imageId,
                imageTagId
            );
            res.json(image);
        })
    );

    router.delete(
        "/api/images/:imageId/tags/:imageTagId",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const imageTagId = +req.params.imageTagId;
            const image = await imageManagementOperator.removeImageTagFromImage(
                authenticatedUserInfo,
                imageId,
                imageTagId
            );
            res.json(image);
        })
    );

    router.post(
        "/api/images/:imageId/regions",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const border = req.body.border as Polygon;
            const holes = req.body.holes as Polygon[];
            const regionLabelId = +req.body.region_label_id;
            const image = await regionManagementOperator.createRegion(
                authenticatedUserInfo,
                imageId,
                border,
                holes,
                regionLabelId
            );
            res.json(image);
        })
    );

    router.post(
        "/api/images/:imageId/regions/:regionId",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const regionId = +req.params.regionId;
            const image = await regionManagementOperator.deleteRegion(
                authenticatedUserInfo,
                imageId,
                regionId
            );
            res.json(image);
        })
    );

    router.patch(
        "/api/images/:imageId/regions/:regionId/boundary",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const regionId = +req.params.regionId;
            const border = req.body.border as Polygon;
            const holes = req.body.holes as Polygon[];
            const image = await regionManagementOperator.updateRegionBoundary(
                authenticatedUserInfo,
                imageId,
                regionId,
                border,
                holes
            );
            res.json(image);
        })
    );

    router.patch(
        "/api/images/:imageId/regions/:regionId/label",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const regionId = +req.params.regionId;
            const regionLabelId = +req.body.region_label_id;
            const image = await regionManagementOperator.updateRegionLabel(
                authenticatedUserInfo,
                imageId,
                regionId,
                regionLabelId
            );
            res.json(image);
        })
    );

    router.get(
        "/api/images/:imageId/regions/:regionId/operation-logs",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const regionId = +req.params.regionId;
            const regionOperationLogList =
                await regionManagementOperator.getRegionOperationLogList(
                    authenticatedUserInfo,
                    imageId,
                    regionId
                );
            res.json({
                region_operation_log_list: regionOperationLogList,
            });
        })
    );

    return router;
}

injected(
    getImagesRouter,
    IMAGE_MANAGEMENT_OPERATOR_TOKEN,
    IMAGE_LIST_MANAGEMENT_OPERATOR_TOKEN,
    REGION_MANAGEMENT_OPERATOR_TOKEN,
    AUTH_MIDDLEWARE_FACTORY_TOKEN
);

export const IMAGES_ROUTER_TOKEN = token<express.Router>("ImagesRouter");
