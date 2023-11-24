import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import {
    ImageListManagementOperator,
    ImageManagementOperator,
    IMAGE_LIST_MANAGEMENT_OPERATOR_TOKEN,
    IMAGE_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/images";
import { RegionManagementOperator, REGION_MANAGEMENT_OPERATOR_TOKEN } from "../../module/regions";
import { Polygon, Vertex } from "../../module/schemas";
import {
    AuthenticatedUserInformation,
    AuthMiddlewareFactory,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    checkUserHasUserPermission,
    getCommaSeparatedIdList,
} from "../utils";
import { getImageListFilterOptionsFromQueryParams } from "./utils";

const IMAGES_UPLOAD_PERMISSION = "images.upload";
const IMAGES_MANAGE_ALL_PERMISSION = "images.manage.all";
const DEFAULT_GET_DETECTION_TASK_LIST_LIMIT = 10;
const DEFAULT_GET_MANAGEABLE_USER_LIMIT = 10;
const DEFAULT_GET_VERIFIABLE_USER_LIMIT = 10;

export function getImagesRouter(
    imageManagementOperator: ImageManagementOperator,
    imageListManagementOperator: ImageListManagementOperator,
    regionManagementOperator: RegionManagementOperator,
    authMiddlewareFactory: AuthMiddlewareFactory
): express.Router {
    const router = express.Router();

    const userLoggedInAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(() => true, true);
    const imagesUploadAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(
        (authUserInfo) => checkUserHasUserPermission(authUserInfo.userPermissionList, IMAGES_UPLOAD_PERMISSION),
        true
    );
    const imagesManageAllAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(
        (authUserInfo) => checkUserHasUserPermission(authUserInfo.userPermissionList, IMAGES_MANAGE_ALL_PERMISSION),
        true
    );

    router.post(
        "/api/images",
        imagesUploadAuthMiddleware,
        asyncHandler(async (req, res) => {
            const fileList = req.files as Express.Multer.File[];

            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageTypeId =
                req.body.image_type_id === undefined || req.body.image_type_id === ""
                    ? undefined
                    : +req.body.image_type_id;
            const imageTagIdList = getCommaSeparatedIdList(req.body.image_tag_id_list || "");
            const description = req.body.description || "";
            const originalFileName = fileList[0].originalname;
            const imageData = fileList[0].buffer;
            const shouldUseDetectionModel = req.body.should_use_detection_model === "1";

            const image = await imageManagementOperator.createImage(
                authenticatedUserInfo,
                imageTypeId,
                imageTagIdList,
                originalFileName,
                description,
                imageData,
                shouldUseDetectionModel
            );
            res.json(image);
        })
    );

    router.patch(
        "/api/images",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageIdList = req.body.image_id_list as number[];
            const imageTypeId = +req.body.image_type_id;
            await imageListManagementOperator.updateImageList(authenticatedUserInfo, imageIdList, imageTypeId);
            res.json({});
        })
    );

    router.delete(
        "/api/images",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageIdList = req.body.image_id_list as number[];
            await imageListManagementOperator.deleteImageList(authenticatedUserInfo, imageIdList);
            res.json({});
        })
    );

    router.get(
        "/api/images/detection-task",
        imagesManageAllAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const offset = +(req.query.offset || 0);
            const limit = +(req.query.limit || DEFAULT_GET_DETECTION_TASK_LIST_LIMIT);
            const sortOrder = +(req.query.sort_order || 0);
            const filterOptions = getImageListFilterOptionsFromQueryParams(req.query);
            const { totalDetectionTaskCount, detectionTaskList } =
                await imageListManagementOperator.getImageDetectionTaskList(
                    authenticatedUserInfo,
                    offset,
                    limit,
                    sortOrder,
                    filterOptions
                );
            res.json({
                total_detection_task_count: totalDetectionTaskCount,
                detection_task_list: detectionTaskList,
            });
        })
    );

    router.post(
        "/api/images/detection-task",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageIdList = req.body.image_id_list as number[];
            await imageListManagementOperator.createImageDetectionTaskList(authenticatedUserInfo, imageIdList);
            res.json({});
        })
    );

    router.get(
        "/api/images/:imageId",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const { image, imageTagList, regionList, pointOfInterestList, canEdit, canVerify } =
                await imageManagementOperator.getImage(authenticatedUserInfo, imageId);
            res.json({
                image: image,
                image_tag_list: imageTagList,
                region_list: regionList,
                point_of_interest_list: pointOfInterestList,
                can_edit: canEdit,
                can_verify: canVerify,
            });
        })
    );

    router.patch(
        "/api/images/:imageId",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
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
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            await imageManagementOperator.deleteImage(authenticatedUserInfo, imageId);
            res.json({});
        })
    );

    router.get(
        "/api/images/:imageId/region-snapshots",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const atStatus = +(req.query.at_status || 0);
            const regionSnapshotList = await imageManagementOperator.getImageRegionSnapshotList(
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
        "/api/images/:imageId/manageable-images-position",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const sortOrder = +(req.query.sort_order || 0);
            const filterOptions = getImageListFilterOptionsFromQueryParams(req.query);
            const { position, totalImageCount, prevImageId, nextImageId } =
                await imageListManagementOperator.getImagePositionInUserManageableImageList(
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

    router.get(
        "/api/images/:imageId/manageable-users",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const offset = +(req.query.offset || 0);
            const limit = +(req.query.limit || DEFAULT_GET_MANAGEABLE_USER_LIMIT);
            const { totalUserCount, userList } = await imageManagementOperator.getUserCanManageImageList(
                authenticatedUserInfo,
                imageId,
                offset,
                limit
            );
            res.json({
                total_user_count: totalUserCount,
                user_list: userList.map((item) => {
                    return { user: item.user, can_edit: item.canEdit };
                }),
            });
        })
    );

    router.post(
        "/api/images/:imageId/manageable-users",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const userId = +req.body.user_id;
            const canEdit = req.body.can_edit;
            const manageableUser = await imageManagementOperator.createUserCanManageImage(
                authenticatedUserInfo,
                imageId,
                userId,
                canEdit
            );
            res.json({ user: manageableUser.user, can_edit: manageableUser.canEdit });
        })
    );

    router.patch(
        "/api/images/:imageId/manageable-users/:userId",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const userId = +req.params.userId;
            const canEdit = req.body.can_edit;
            const manageableUser = await imageManagementOperator.updateUserCanManageImage(
                authenticatedUserInfo,
                imageId,
                userId,
                canEdit
            );
            res.json({ user: manageableUser.user, can_edit: manageableUser.canEdit });
        })
    );

    router.delete(
        "/api/images/:imageId/manageable-users/:userId",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const userId = +req.params.userId;
            await imageManagementOperator.deleteUserCanManageImage(authenticatedUserInfo, imageId, userId);
            res.json({});
        })
    );

    router.get(
        "/api/images/:imageId/verifiable-images-position",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const sortOrder = +(req.query.sort_order || 0);
            const filterOptions = getImageListFilterOptionsFromQueryParams(req.query);
            const { position, totalImageCount, prevImageId, nextImageId } =
                await imageListManagementOperator.getImagePositionInUserVerifiableImageList(
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

    router.get(
        "/api/images/:imageId/verifiable-users",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const offset = +(req.query.offset || 0);
            const limit = +(req.query.limit || DEFAULT_GET_VERIFIABLE_USER_LIMIT);
            const { totalUserCount, userList } = await imageManagementOperator.getUserCanVerifyImageList(
                authenticatedUserInfo,
                imageId,
                offset,
                limit
            );
            res.json({
                total_user_count: totalUserCount,
                user_list: userList.map((user) => {
                    return { user };
                }),
            });
        })
    );

    router.post(
        "/api/images/:imageId/verifiable-users",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const userId = +req.body.user_id;
            const user = await imageManagementOperator.createUserCanVerifyImage(authenticatedUserInfo, imageId, userId);
            res.json({ user });
        })
    );

    router.delete(
        "/api/images/:imageId/verifiable-users/:userId",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const userId = +req.params.userId;
            await imageManagementOperator.deleteUserCanVerifyImage(authenticatedUserInfo, imageId, userId);
            res.json({});
        })
    );

    router.patch(
        "/api/images/:imageId/image-type",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const imageTypeId = +(req.body.image_type_id || 0);
            const image = await imageManagementOperator.updateImageType(authenticatedUserInfo, imageId, imageTypeId);
            res.json({ image });
        })
    );

    router.patch(
        "/api/images/:imageId/status",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const status = +(req.body.status || 0);
            const image = await imageManagementOperator.updateImageStatus(authenticatedUserInfo, imageId, status);
            res.json({ image });
        })
    );

    router.post(
        "/api/images/tags",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageIdList = req.body.image_id_list;
            const imageTagIdList = req.body.image_tag_id_list;
            await imageListManagementOperator.addImageTagListToImageList(
                authenticatedUserInfo,
                imageIdList,
                imageTagIdList
            );
            res.json({});
        })
    );

    router.post(
        "/api/images/:imageId/tags",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const imageTagId = +(req.body.image_tag_id || 0);
            await imageManagementOperator.addImageTagToImage(authenticatedUserInfo, imageId, imageTagId);
            res.json({});
        })
    );

    router.post(
        "/api/images/:imageId/bookmark",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const description = req.body.description || "";
            const imageBookmark = await imageManagementOperator.createImageBookmark(
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
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const imageBookmark = await imageManagementOperator.getImageBookmark(authenticatedUserInfo, imageId);
            res.json({
                image_bookmark: imageBookmark,
            });
        })
    );

    router.patch(
        "/api/images/:imageId/bookmark",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const description = req.body.description || "";
            const imageBookmark = await imageManagementOperator.updateImageBookmark(
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
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            await imageManagementOperator.deleteImageBookmark(authenticatedUserInfo, imageId);
            res.json({});
        })
    );

    router.post(
        "/api/images/:imageId/pois",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const coordinate = new Vertex(req.body.coordinate.x || 0, req.body.coordinate.y || 0);
            const description = req.body.description || "";
            const poi = await imageManagementOperator.addPointOfInterestToImage(
                authenticatedUserInfo,
                imageId,
                coordinate,
                description
            );
            res.json({ point_of_interest: poi });
        })
    );

    router.patch(
        "/api/images/:imageId/pois/:poiId",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const podId = +req.params.poiId;
            const coordinate = new Vertex(req.body.coordinate.x || 0, req.body.coordinate.y || 0);
            const description = req.body.description || "";
            const poi = await imageManagementOperator.updatePointOfInterestOfImage(
                authenticatedUserInfo,
                imageId,
                podId,
                coordinate,
                description
            );
            res.json({ point_of_interest: poi });
        })
    );

    router.delete(
        "/api/images/:imageId/pois/:poiId",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const podId = +req.params.poiId;
            await imageManagementOperator.deletePointOfInterestOfImage(authenticatedUserInfo, imageId, podId);
            res.json({});
        })
    );

    router.delete(
        "/api/images/:imageId/tags/:imageTagId",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const imageTagId = +req.params.imageTagId;
            await imageManagementOperator.removeImageTagFromImage(authenticatedUserInfo, imageId, imageTagId);
            res.json({});
        })
    );

    router.post(
        "/api/images/:imageId/regions",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
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
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            await regionManagementOperator.deleteRegionOfImage(authenticatedUserInfo, imageId);
            res.json({});
        })
    );

    router.delete(
        "/api/images/:imageId/regions/:regionId",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const regionId = +req.params.regionId;
            await regionManagementOperator.deleteRegion(authenticatedUserInfo, imageId, regionId);
            res.json({});
        })
    );

    router.patch(
        "/api/images/:imageId/regions/:regionId/boundary",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
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
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
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
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const imageId = +req.params.imageId;
            const regionId = +req.params.regionId;
            const regionOperationLogList = await regionManagementOperator.getRegionOperationLogList(
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
