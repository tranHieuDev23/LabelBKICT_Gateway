import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import httpStatus from "http-status";
import multer from "multer";
import {
    ImageManagementOperator,
    IMAGE_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/images";
import {
    RegionManagementOperator,
    REGION_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/regions";
import {
    AuthenticatedUserInformation,
    AuthMiddlewareFactory,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    checkUserHasUserPermission,
    getCommaSeparatedIDList,
} from "../utils";

const IMAGES_UPLOAD_PERMISSION = "images.upload";

const FIVE_MEGABYTE = 5 * 1024 * 1024;
const imageMulterMiddleware = multer({
    limits: {
        files: 1,
        fileSize: FIVE_MEGABYTE,
    },
    fileFilter: (request, file, callback) => {
        callback(null, file.mimetype.startsWith("image/"));
    },
}).single("image_file");

export function getImagesRouter(
    imageManagementOperator: ImageManagementOperator,
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
        imageMulterMiddleware,
        asyncHandler(async (req, res) => {
            if (req.file === undefined) {
                res.status(httpStatus.BAD_REQUEST).json({});
                return;
            }

            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageTypeID =
                req.body.image_type_id === undefined
                    ? undefined
                    : +req.body.image_type_id;
            const imageTagIDList = getCommaSeparatedIDList(
                req.body.image_tag_id_list || ""
            );
            const description = req.body.description || "";
            const originalFileName = req.file.originalname;
            const imageData = req.file.buffer;

            const image = await imageManagementOperator.createImage(
                authenticatedUserInfo,
                imageTypeID,
                imageTagIDList,
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
            const imageIDList = req.body.image_id_list as number[];
            const imageTypeID = +req.body.image_type_id;
            await imageManagementOperator.updateImageList(
                authenticatedUserInfo,
                imageIDList,
                imageTypeID
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
            const imageIDList = req.body.image_id_list as number[];
            await imageManagementOperator.deleteImageList(
                authenticatedUserInfo,
                imageIDList
            );
            res.json({});
        })
    );

    router.get(
        "/api/images/:imageID",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageID = +req.params.imageID;
            const { image, imageTagList, regionList } =
                await imageManagementOperator.getImage(
                    authenticatedUserInfo,
                    imageID
                );
            res.json({
                image: image,
                image_tag_list: imageTagList,
                region_list: regionList,
            });
        })
    );

    router.patch(
        "/api/images/:imageID",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageID = +req.params.imageID;
            const description = req.body.description as string | undefined;
            const image = await imageManagementOperator.updateImageMetadata(
                authenticatedUserInfo,
                imageID,
                description
            );
            res.json(image);
        })
    );

    router.delete(
        "/api/images/:imageID",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageID = +req.params.imageID;
            await imageManagementOperator.deleteImage(
                authenticatedUserInfo,
                imageID
            );
            res.json({});
        })
    );

    router.get(
        "/api/images/:imageID/region-snapshot",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageID = +req.params.imageID;
            const atStatus = +req.body.at_status;
            const regionSnapshotList =
                await imageManagementOperator.getImageRegionSnapshotList(
                    authenticatedUserInfo,
                    imageID,
                    atStatus
                );
            res.json({
                region_list: regionSnapshotList,
            });
        })
    );

    router.patch(
        "/api/images/:imageID/image-type",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageID = +req.params.imageID;
            const imageTypeID = +(req.body.image_type_id || 0);
            const image = await imageManagementOperator.updateImageType(
                authenticatedUserInfo,
                imageID,
                imageTypeID
            );
            res.json(image);
        })
    );

    router.patch(
        "/api/images/:imageID/status",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageID = +req.params.imageID;
            const status = +(req.body.status || 0);
            const image = await imageManagementOperator.updateImageStatus(
                authenticatedUserInfo,
                imageID,
                status
            );
            res.json(image);
        })
    );

    router.patch(
        "/api/images/:imageID/tags",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageID = +req.params.imageID;
            const imageTagID = +(req.body.image_tag_id || 0);
            const image = await imageManagementOperator.addImageTagToImage(
                authenticatedUserInfo,
                imageID,
                imageTagID
            );
            res.json(image);
        })
    );

    router.delete(
        "/api/images/:imageID/tags/:imageTagID",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const imageID = +req.params.imageID;
            const imageTagID = +req.params.imageTagID;
            const image = await imageManagementOperator.removeImageTagFromImage(
                authenticatedUserInfo,
                imageID,
                imageTagID
            );
            res.json(image);
        })
    );

    return router;
}

injected(
    getImagesRouter,
    IMAGE_MANAGEMENT_OPERATOR_TOKEN,
    REGION_MANAGEMENT_OPERATOR_TOKEN,
    AUTH_MIDDLEWARE_FACTORY_TOKEN
);

export const IMAGES_ROUTER_TOKEN = token<express.Router>("ImagesRouter");
