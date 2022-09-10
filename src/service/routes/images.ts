import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
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
import {
    AuthenticatedUserInformation,
    AuthMiddlewareFactory,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    checkUserHasUserPermission,
    CheckUserDisabledMiddlewareFactory,
    CHECK_USER_DISABLED_MIDDLEWARE_FACTORY_TOKEN,
    getCommaSeparatedIdList,
} from "../utils";
import { getImageListFilterOptionsFromQueryParams } from "./utils";

const IMAGES_UPLOAD_PERMISSION = "images.upload";

export function getImagesRouter(
    imageManagementOperator: ImageManagementOperator,
    imageListManagementOperator: ImageListManagementOperator,
    regionManagementOperator: RegionManagementOperator,
    authMiddlewareFactory: AuthMiddlewareFactory,
    checkUserDisabledMiddlewareFactory: CheckUserDisabledMiddlewareFactory
): express.Router {
    const router = express.Router();

    const userLoggedInAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(
        () => true,
        true
    );
    const checkUserDisabledMiddleware = checkUserDisabledMiddlewareFactory.checkUserIsDisabled();
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
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
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
        checkUserDisabledMiddleware,
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
        checkUserDisabledMiddleware,
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
        checkUserDisabledMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const { image, imageTagList, regionList, canEdit } =
                await imageManagementOperator.getImage(
                    authenticatedUserInfo,
                    imageId
                );
            res.json({
                image: image,
                image_tag_list: imageTagList,
                region_list: regionList,
                can_edit: canEdit,
            });
        })
    );

    router.patch(
        "/api/images/:imageId",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
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
            res.json({ image });
        })
    );

    router.delete(
        "/api/images/:imageId",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
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
        "/api/images/:imageId/region-snapshots",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const atStatus = +(req.query.at_status || 0);
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

    router.get(
        "/api/images/:imageId/position",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const sortOrder = +(req.query.sort_order || 0);
            const filterOptions = getImageListFilterOptionsFromQueryParams(
                req.query
            );
            const { position, totalImageCount, prevImageId, nextImageId } =
                await imageListManagementOperator.getImagePositionInList(
                    authenticatedUserInfo,
                    imageId,
                    sortOrder,
                    filterOptions
                );

            const responseBody: any = {
                position,
                total_image_count: totalImageCount,
                prev_image_id: prevImageId,
                next_image_id: nextImageId,
            };
            res.json(responseBody);
        })
    );

    router.patch(
        "/api/images/:imageId/image-type",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
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
            res.json({ image });
        })
    );

    router.patch(
        "/api/images/:imageId/status",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
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
            res.json({ image });
        })
    );

    router.post(
        "/api/images/:imageId/tags",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const imageTagId = +(req.body.image_tag_id || 0);
            await imageManagementOperator.addImageTagToImage(
                authenticatedUserInfo,
                imageId,
                imageTagId
            );
            res.json({});
        })
    );

    router.post(
        "/api/images/detection-task",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageIdList = req.body.image_id_list as number[];
            await imageListManagementOperator.createImageDetectionTaskList(
                authenticatedUserInfo,
                imageIdList
            );
            res.json({});
        })
    );

    router.post(
        "/api/images/:imageId/bookmark",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const description = req.body.description || "";
            const imageBookmark =
                await imageManagementOperator.createImageBookmark(
                    authenticatedUserInfo,
                    imageId,
                    description
                );
            res.json({
                image_bookmark: imageBookmark,
            });
        })
    );

    router.get(
        "/api/images/:imageId/bookmark",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const imageBookmark =
                await imageManagementOperator.getImageBookmark(
                    authenticatedUserInfo,
                    imageId
                );
            res.json({
                image_bookmark: imageBookmark,
            });
        })
    );

    router.patch(
        "/api/images/:imageId/bookmark",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const description = req.body.description || "";
            const imageBookmark =
                await imageManagementOperator.updateImageBookmark(
                    authenticatedUserInfo,
                    imageId,
                    description
                );
            res.json({
                image_bookmark: imageBookmark,
            });
        })
    );

    router.delete(
        "/api/images/:imageId/bookmark",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            await imageManagementOperator.deleteImageBookmark(
                authenticatedUserInfo,
                imageId
            );
            res.json({});
        })
    );

    router.delete(
        "/api/images/:imageId/tags/:imageTagId",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const imageTagId = +req.params.imageTagId;
            await imageManagementOperator.removeImageTagFromImage(
                authenticatedUserInfo,
                imageId,
                imageTagId
            );
            res.json({});
        })
    );

    router.post(
        "/api/images/:imageId/regions",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const border = req.body.border as Polygon;
            const holes = req.body.holes as Polygon[];
            const regionLabelId = +req.body.region_label_id;
            const region = await regionManagementOperator.createRegion(
                authenticatedUserInfo,
                imageId,
                border,
                holes,
                regionLabelId
            );
            res.json({ region });
        })
    );

    router.delete(
        "/api/images/:imageId/regions",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            await regionManagementOperator.deleteRegionOfImage(
                authenticatedUserInfo,
                imageId
            );
            res.json({});
        })
    );

    router.delete(
        "/api/images/:imageId/regions/:regionId",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const regionId = +req.params.regionId;
            await regionManagementOperator.deleteRegion(
                authenticatedUserInfo,
                imageId,
                regionId
            );
            res.json({});
        })
    );

    router.patch(
        "/api/images/:imageId/regions/:regionId/boundary",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const regionId = +req.params.regionId;
            const border = req.body.border as Polygon;
            const holes = req.body.holes as Polygon[];
            const region = await regionManagementOperator.updateRegionBoundary(
                authenticatedUserInfo,
                imageId,
                regionId,
                border,
                holes
            );
            res.json({ region });
        })
    );

    router.patch(
        "/api/images/:imageId/regions/:regionId/label",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const regionId = +req.params.regionId;
            const regionLabelId = +req.body.region_label_id;
            const region = await regionManagementOperator.updateRegionLabel(
                authenticatedUserInfo,
                imageId,
                regionId,
                regionLabelId
            );
            res.json({ region });
        })
    );

    router.get(
        "/api/images/:imageId/regions/:regionId/operation-logs",
        userLoggedInAuthMiddleware,
        checkUserDisabledMiddleware,
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
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    CHECK_USER_DISABLED_MIDDLEWARE_FACTORY_TOKEN
);

export const IMAGES_ROUTER_TOKEN = token<express.Router>("ImagesRouter");
