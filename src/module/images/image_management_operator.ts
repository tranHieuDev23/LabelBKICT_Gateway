import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { IMAGE_SERVICE_DM_TOKEN, MODEL_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { ModelServiceClient } from "../../proto/gen/ModelService";
import { AuthenticatedUserInformation } from "../../service/utils";
import { ErrorWithHTTPCode, getHttpCodeFromGRPCStatus, LOGGER_TOKEN, promisifyGRPCCall } from "../../utils";
import {
    Image,
    ImageBookmark,
    ImageProtoToImageConverter,
    ImageStatus,
    ImageStatusToImageStatusProtoConverter,
    ImageTag,
    IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN,
    IMAGE_STATUS_TO_IMAGE_STATUS_PROTO_CONVERTER_TOKEN,
    Region,
    RegionProtoToRegionConverter,
    REGION_PROTO_TO_REGION_CONVERTER_TOKEN,
    User,
    Vertex,
    PointOfInterest,
    PointOfInterestProtoToPointOfInterestConverter,
    POINT_OF_INTEREST_PROTO_TO_POINT_OF_INTEREST_CONVERTER_TOKEN,
} from "../schemas";
import {
    MANAGE_SELF_AND_ALL_AND_VERIFY_CHECKER_TOKEN,
    MANAGE_SELF_AND_ALL_CAN_EDIT_AND_VERIFY_CHECKER_TOKEN,
    MANAGE_SELF_AND_ALL_CAN_EDIT_CHECKER_TOKEN,
    ImagePermissionChecker,
    VERIFY_CHECKER_TOKEN,
} from "../image_permissions";
import {
    ImageInfoProvider,
    IMAGE_INFO_PROVIDER_TOKEN,
    UserInfoProvider,
    USER_INFO_PROVIDER_TOKEN,
} from "../info_providers";
import { status } from "@grpc/grpc-js";

export interface ImageManagementOperator {
    createImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageTypeId: number | undefined,
        imageTagIdList: number[],
        originalFileName: string,
        description: string,
        imageData: Buffer,
        shouldUseDetectionModel: boolean
    ): Promise<Image>;
    getImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number
    ): Promise<{
        image: Image;
        imageTagList: ImageTag[];
        regionList: Region[];
        pointOfInterestList: PointOfInterest[];
        canEdit: boolean;
        canVerify: boolean;
    }>;
    getImageRegionSnapshotList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        atStatus: ImageStatus
    ): Promise<Region[]>;
    updateImageMetadata(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        description: string | undefined
    ): Promise<Image>;
    updateImageType(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        imageTypeId: number
    ): Promise<Image>;
    updateImageStatus(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        status: ImageStatus
    ): Promise<Image>;
    addImageTagToImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        imageTagId: number
    ): Promise<void>;
    removeImageTagFromImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        imageTagId: number
    ): Promise<void>;
    createDetectionTaskForImage(authenticatedUserInfo: AuthenticatedUserInformation, imageId: number): Promise<void>;
    createImageBookmark(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        description: string
    ): Promise<ImageBookmark>;
    getImageBookmark(authenticatedUserInfo: AuthenticatedUserInformation, imageId: number): Promise<ImageBookmark>;
    updateImageBookmark(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        description: string
    ): Promise<ImageBookmark>;
    deleteImageBookmark(authenticatedUserInfo: AuthenticatedUserInformation, imageId: number): Promise<void>;
    getUserCanManageImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        offset: number,
        limit: number
    ): Promise<{
        totalUserCount: number;
        userList: { user: User; canEdit: boolean }[];
    }>;
    createUserCanManageImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        userId: number,
        canEdit: boolean
    ): Promise<{ user: User; canEdit: boolean }>;
    updateUserCanManageImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        userId: number,
        canEdit: boolean
    ): Promise<{ user: User; canEdit: boolean }>;
    deleteUserCanManageImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        userId: number
    ): Promise<void>;
    getUserCanVerifyImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        offset: number,
        limit: number
    ): Promise<{ totalUserCount: number; userList: User[] }>;
    createUserCanVerifyImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        userId: number
    ): Promise<User>;
    deleteUserCanVerifyImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        userId: number
    ): Promise<void>;
    deleteImage(authenticatedUserInfo: AuthenticatedUserInformation, imageId: number): Promise<void>;
    addPointOfInterestToImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        coordinate: Vertex,
        description: string
    ): Promise<PointOfInterest>;
    updatePointOfInterestOfImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        poiId: number,
        coordinate: Vertex,
        description: string
    ): Promise<PointOfInterest>;
    deletePointOfInterestOfImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        poiId: number
    ): Promise<void>;
}

export class ImageManagementOperatorImpl implements ImageManagementOperator {
    constructor(
        private readonly imageInfoProvider: ImageInfoProvider,
        private readonly userInfoProvider: UserInfoProvider,
        private readonly manageSelfAndAllCanEditChecker: ImagePermissionChecker,
        private readonly manageSelfAndAllAndVerifyChecker: ImagePermissionChecker,
        private readonly manageSelfAndAllCanEditAndVerifyChecker: ImagePermissionChecker,
        private readonly verifyChecker: ImagePermissionChecker,
        private readonly imageProtoToImageConverter: ImageProtoToImageConverter,
        private readonly regionProtoToRegionConverter: RegionProtoToRegionConverter,
        private readonly imageStatusToImageStatusProtoConverter: ImageStatusToImageStatusProtoConverter,
        private readonly poiProtoToPOIConverter: PointOfInterestProtoToPointOfInterestConverter,
        private readonly imageServiceDM: ImageServiceClient,
        private readonly modelServiceDM: ModelServiceClient,
        private readonly logger: Logger
    ) {}

    public async createImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageTypeId: number | undefined,
        imageTagIdList: number[],
        originalFileName: string,
        description: string,
        imageData: Buffer,
        shouldUseDetectionModel: boolean
    ): Promise<Image> {
        const { error: createImageError, response: createImageTypeResponse } = await promisifyGRPCCall(
            this.imageServiceDM.createImage.bind(this.imageServiceDM),
            {
                uploadedByUserId: authenticatedUserInfo.user.id,
                imageTypeId: imageTypeId,
                originalFileName: originalFileName,
                description: description,
                imageData: imageData,
                imageTagIdList: imageTagIdList,
                shouldUseDetectionModel: shouldUseDetectionModel,
            }
        );
        if (createImageError !== null) {
            this.logger.error("failed to call image_service.image_service.createImage()", { error: createImageError });
            throw new ErrorWithHTTPCode("Failed to create new image", getHttpCodeFromGRPCStatus(createImageError.code));
        }

        const imageProto = createImageTypeResponse?.image;
        return await this.imageProtoToImageConverter.convert(imageProto);
    }

    public async getImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number
    ): Promise<{
        image: Image;
        imageTagList: ImageTag[];
        regionList: Region[];
        pointOfInterestList: PointOfInterest[];
        canEdit: boolean;
        canVerify: boolean;
    }> {
        const {
            image: imageProto,
            imageTagList: imageTagProtoList,
            regionList: regionProtoList,
            pointOfInterestList: pointOfInterestProtoList,
        } = await this.imageInfoProvider.getImage(imageId, true, true, true);

        const canUserAccessImage = await this.manageSelfAndAllAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to get image", httpStatus.FORBIDDEN);
        }

        const image = await this.imageProtoToImageConverter.convert(imageProto);
        const imageTagList = (imageTagProtoList || []).map(ImageTag.fromProto);
        const regionList = await Promise.all(
            (regionProtoList || []).map((regionProto) => this.regionProtoToRegionConverter.convert(regionProto))
        );
        const pointOfInterestList = await Promise.all(
            (pointOfInterestProtoList || []).map((poiProto) => this.poiProtoToPOIConverter.convert(poiProto))
        );
        const canEdit = await this.manageSelfAndAllCanEditChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        const canVerify = await this.verifyChecker.checkUserHasPermissionForImage(authenticatedUserInfo, imageId);

        return { image, imageTagList, regionList, pointOfInterestList, canEdit, canVerify };
    }

    public async getImageRegionSnapshotList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        atStatus: ImageStatus
    ): Promise<Region[]> {
        const canUserAccessImage = await this.manageSelfAndAllAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to get region snapshot list of image", httpStatus.FORBIDDEN);
        }

        const { error: getRegionSnapshotListOfImageError, response: getRegionSnapshotListOfImageResponse } =
            await promisifyGRPCCall(this.imageServiceDM.getRegionSnapshotListOfImage.bind(this.imageServiceDM), {
                ofImageId: imageId,
                atStatus: atStatus,
            });
        if (getRegionSnapshotListOfImageError !== null) {
            this.logger.error("failed to call image_service.getRegionSnapshotListOfImage()", {
                error: getRegionSnapshotListOfImageError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to get region snapshot list of image",
                getHttpCodeFromGRPCStatus(getRegionSnapshotListOfImageError.code)
            );
        }

        const regionProtoList = getRegionSnapshotListOfImageResponse?.regionList || [];
        const regionList = await Promise.all(
            regionProtoList.map((regionProto) => this.regionProtoToRegionConverter.convert(regionProto))
        );
        return regionList;
    }

    public async updateImageMetadata(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        description: string | undefined
    ): Promise<Image> {
        const canUserAccessImage = await this.manageSelfAndAllCanEditAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to update metadata of image", httpStatus.FORBIDDEN);
        }

        const { error: updateImageMetadataError, response: updateImageMetadataResponse } = await promisifyGRPCCall(
            this.imageServiceDM.updateImageMetadata.bind(this.imageServiceDM),
            { id: imageId, description: description }
        );
        if (updateImageMetadataError !== null) {
            this.logger.error("failed to call image_service.updateImageMetadata()", {
                error: updateImageMetadataError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to update metadata of image",
                getHttpCodeFromGRPCStatus(updateImageMetadataError.code)
            );
        }

        const updatedImageProto = updateImageMetadataResponse?.image;
        const updatedImage = this.imageProtoToImageConverter.convert(updatedImageProto);
        return updatedImage;
    }

    public async updateImageType(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        imageTypeId: number
    ): Promise<Image> {
        const canUserAccessImage = await this.manageSelfAndAllCanEditAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to update image type of image", httpStatus.FORBIDDEN);
        }

        const { error: updateImageImageTypeError, response: updateImageImageTypeResponse } = await promisifyGRPCCall(
            this.imageServiceDM.updateImageImageType.bind(this.imageServiceDM),
            { id: imageId, imageTypeId: imageTypeId }
        );
        if (updateImageImageTypeError !== null) {
            this.logger.error("failed to call image_service.updateImageImageType()", {
                error: updateImageImageTypeError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to update image type of image",
                getHttpCodeFromGRPCStatus(updateImageImageTypeError.code)
            );
        }

        const updatedImageProto = updateImageImageTypeResponse?.image;
        const updatedImage = this.imageProtoToImageConverter.convert(updatedImageProto);
        return updatedImage;
    }

    public async updateImageStatus(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        status: ImageStatus
    ): Promise<Image> {
        const canUserAccessImage = await this.manageSelfAndAllCanEditAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to update status of image", httpStatus.FORBIDDEN);
        }

        const statusProto = this.imageStatusToImageStatusProtoConverter.convert(status);

        const { error: updateImageStatusError, response: updateImageStatusResponse } = await promisifyGRPCCall(
            this.imageServiceDM.updateImageStatus.bind(this.imageServiceDM),
            {
                id: imageId,
                status: statusProto,
                byUserId: authenticatedUserInfo.user.id,
            }
        );
        if (updateImageStatusError !== null) {
            this.logger.error("failed to call image_service.updateImageStatus()", { error: updateImageStatusError });
            throw new ErrorWithHTTPCode(
                "Failed to update status of image",
                getHttpCodeFromGRPCStatus(updateImageStatusError.code)
            );
        }

        const updatedImageProto = updateImageStatusResponse?.image;
        const updatedImage = this.imageProtoToImageConverter.convert(updatedImageProto);
        return updatedImage;
    }

    public async addImageTagToImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        imageTagId: number
    ): Promise<void> {
        const canUserAccessImage = await this.manageSelfAndAllCanEditAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to add image tag to image", httpStatus.FORBIDDEN);
        }

        const { error: addImageTagToImageError } = await promisifyGRPCCall(
            this.imageServiceDM.addImageTagToImage.bind(this.imageServiceDM),
            {
                imageId: imageId,
                imageTagId: imageTagId,
            }
        );
        if (addImageTagToImageError !== null) {
            this.logger.error("failed to call image_service.addImageTagToImage()", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode(
                "Failed to add image tag to image",
                getHttpCodeFromGRPCStatus(addImageTagToImageError.code)
            );
        }
    }

    public async removeImageTagFromImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        imageTagId: number
    ): Promise<void> {
        const canUserAccessImage = await this.manageSelfAndAllCanEditAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to remove image tag from image", httpStatus.FORBIDDEN);
        }

        const { error: removeImageTagFromImageError } = await promisifyGRPCCall(
            this.imageServiceDM.removeImageTagFromImage.bind(this.imageServiceDM),
            {
                imageId: imageId,
                imageTagId: imageTagId,
            }
        );
        if (removeImageTagFromImageError !== null) {
            this.logger.error("failed to call image_service.removeImageTagFromImage()", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode(
                "Failed to remove image tag from image",
                getHttpCodeFromGRPCStatus(removeImageTagFromImageError.code)
            );
        }
    }

    public async createDetectionTaskForImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number
    ): Promise<void> {
        const canUserAccessImage = await this.manageSelfAndAllCanEditChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to delete image", httpStatus.FORBIDDEN);
        }

        const { error: createDetectionTaskError } = await promisifyGRPCCall(
            this.modelServiceDM.createDetectionTask.bind(this.modelServiceDM),
            { imageId }
        );
        if (createDetectionTaskError !== null) {
            this.logger.error("failed to call model_service.createDetectionTask()", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode(
                "Failed to create detection task for image",
                getHttpCodeFromGRPCStatus(createDetectionTaskError.code)
            );
        }
    }

    public async createImageBookmark(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        description: string
    ): Promise<ImageBookmark> {
        const canUserAccessImage = await this.manageSelfAndAllAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to create image bookmark", httpStatus.FORBIDDEN);
        }

        const { error: createImageBookmarkError, response: createImageBookmarkResponse } = await promisifyGRPCCall(
            this.imageServiceDM.createImageBookmark.bind(this.imageServiceDM),
            {
                userId: authenticatedUserInfo.user.id,
                imageId: imageId,
                description: description,
            }
        );
        if (createImageBookmarkError !== null) {
            this.logger.error("failed to call image_service.createImageBookmark()", {
                error: createImageBookmarkError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to create image bookmark",
                getHttpCodeFromGRPCStatus(createImageBookmarkError.code)
            );
        }

        return ImageBookmark.fromProto(createImageBookmarkResponse?.imageBookmark);
    }

    public async getImageBookmark(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number
    ): Promise<ImageBookmark> {
        const canUserAccessImage = await this.manageSelfAndAllAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to get image bookmark", httpStatus.FORBIDDEN);
        }

        const bookmark = await this.imageInfoProvider.getUserBookmark(authenticatedUserInfo.user.id, imageId);
        if (bookmark === null) {
            this.logger.error("user has not yet bookmarked the image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to get image bookmark", httpStatus.CONFLICT);
        }

        return bookmark;
    }

    public async updateImageBookmark(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        description: string
    ): Promise<ImageBookmark> {
        const canUserAccessImage = await this.manageSelfAndAllAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to update image bookmark", httpStatus.FORBIDDEN);
        }

        const { error: deleteImageBookmarkError, response: updateImageBookmarkResponse } = await promisifyGRPCCall(
            this.imageServiceDM.updateImageBookmark.bind(this.imageServiceDM),
            {
                userId: authenticatedUserInfo.user.id,
                imageId: imageId,
                description: description,
            }
        );
        if (deleteImageBookmarkError !== null) {
            if (deleteImageBookmarkError.code === status.NOT_FOUND) {
                this.logger.error("user has not yet bookmarked the image", {
                    userId: authenticatedUserInfo.user.id,
                    imageId,
                });
                throw new ErrorWithHTTPCode("Failed to update image bookmark", httpStatus.CONFLICT);
            }

            this.logger.error("failed to call image_service.updateImageBookmark()", {
                error: deleteImageBookmarkError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to update image bookmark",
                getHttpCodeFromGRPCStatus(deleteImageBookmarkError.code)
            );
        }

        return ImageBookmark.fromProto(updateImageBookmarkResponse?.imageBookmark);
    }

    public async deleteImageBookmark(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number
    ): Promise<void> {
        const canUserAccessImage = await this.manageSelfAndAllAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to delete image bookmark", httpStatus.FORBIDDEN);
        }

        const { error: deleteImageBookmarkError } = await promisifyGRPCCall(
            this.imageServiceDM.deleteImageBookmark.bind(this.imageServiceDM),
            {
                userId: authenticatedUserInfo.user.id,
                imageId: imageId,
            }
        );
        if (deleteImageBookmarkError !== null) {
            if (deleteImageBookmarkError.code === status.NOT_FOUND) {
                this.logger.error("user has not yet bookmarked the image", {
                    userId: authenticatedUserInfo.user.id,
                    imageId,
                });
                throw new ErrorWithHTTPCode("Failed to delete image bookmark", httpStatus.CONFLICT);
            }

            this.logger.error("failed to call image_service.deleteImageBookmark()", {
                error: deleteImageBookmarkError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to delete image bookmark",
                getHttpCodeFromGRPCStatus(deleteImageBookmarkError.code)
            );
        }
    }

    public async getUserCanManageImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        offset: number,
        limit: number
    ): Promise<{
        totalUserCount: number;
        userList: { user: User; canEdit: boolean }[];
    }> {
        const canUserAccessImage = await this.manageSelfAndAllCanEditChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed get user can manage image list", httpStatus.FORBIDDEN);
        }

        const { error, response } = await promisifyGRPCCall(
            this.imageServiceDM.getUserCanManageImageListOfImageId.bind(this.imageServiceDM),
            { imageId, offset, limit }
        );
        if (error !== null) {
            this.logger.error("failed to call image_service.getUserCanManageImageListOfImageId()", { error, imageId });
            throw new ErrorWithHTTPCode(
                "Failed to get user can manage image list",
                getHttpCodeFromGRPCStatus(error.code)
            );
        }

        const totalUserCount = response?.totalUserCount || 0;

        const userList: { user: User; canEdit: boolean }[] = [];
        if (response?.userCanManageImageList !== undefined) {
            for (const item of response.userCanManageImageList) {
                const user = await this.userInfoProvider.getUser(item.userId || 0);
                if (user === null) {
                    this.logger.info("user with user_id not found", { userId: item.userId });
                    continue;
                }

                userList.push({ user: User.fromProto(user), canEdit: item.canEdit || false });
            }
        }

        return { totalUserCount, userList };
    }

    public async createUserCanManageImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        userId: number,
        canEdit: boolean
    ): Promise<{ user: User; canEdit: boolean }> {
        const canUserAccessImage = await this.manageSelfAndAllCanEditChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to create user can manage image", httpStatus.FORBIDDEN);
        }

        const { image } = await this.imageInfoProvider.getImage(imageId, false, false, false);
        if (image === null) {
            this.logger.error("no image found with the provided image_id", { imageId });
            throw new ErrorWithHTTPCode("Failed to create user can manage image", httpStatus.NOT_FOUND);
        }

        const user = await this.userInfoProvider.getUser(userId);
        if (user === null) {
            this.logger.error("no user found with the provided user_id", { userId });
            throw new ErrorWithHTTPCode("Failed to create user can manage image", httpStatus.NOT_FOUND);
        }

        if (image.uploadedByUserId === user.id) {
            this.logger.error("user is already the uploader of the image", { imageId, userId });
            throw new ErrorWithHTTPCode("Failed to create user can manage image", httpStatus.BAD_REQUEST);
        }

        const { error } = await promisifyGRPCCall(
            this.imageServiceDM.createUserCanManageImage.bind(this.imageServiceDM),
            { userId, imageId, canEdit }
        );
        if (error !== null) {
            this.logger.error("failed to call image_service.createUserCanManageImage()", {
                userId,
                imageId,
                canEdit,
                error,
            });
            throw new ErrorWithHTTPCode(
                "Failed to create user can manage image",
                getHttpCodeFromGRPCStatus(error.code)
            );
        }

        return { user: User.fromProto(user), canEdit };
    }

    public async updateUserCanManageImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        userId: number,
        canEdit: boolean
    ): Promise<{ user: User; canEdit: boolean }> {
        const canUserAccessImage = await this.manageSelfAndAllCanEditChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to update user can manage image", httpStatus.FORBIDDEN);
        }

        const { image } = await this.imageInfoProvider.getImage(imageId, false, false, false);
        if (image === null) {
            this.logger.error("no image found with the provided image_id", { imageId });
            throw new ErrorWithHTTPCode("Failed to update user can manage image", httpStatus.NOT_FOUND);
        }

        const user = await this.userInfoProvider.getUser(userId);
        if (user === null) {
            this.logger.error("no user found with the provided user_id", { userId });
            throw new ErrorWithHTTPCode("Failed to update user can manage image", httpStatus.NOT_FOUND);
        }

        const { error } = await promisifyGRPCCall(
            this.imageServiceDM.updateUserCanManageImage.bind(this.imageServiceDM),
            { userId, imageId, canEdit }
        );
        if (error !== null) {
            this.logger.error("failed to call image_service.updateUserCanManageImage()", {
                userId,
                imageId,
                canEdit,
                error,
            });
            throw new ErrorWithHTTPCode(
                "Failed to update user can manage image",
                getHttpCodeFromGRPCStatus(error.code)
            );
        }

        return { user: User.fromProto(user), canEdit };
    }

    public async deleteUserCanManageImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        userId: number
    ): Promise<void> {
        const canUserAccessImage = await this.manageSelfAndAllCanEditChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to delete user can manage image", httpStatus.FORBIDDEN);
        }

        const { image } = await this.imageInfoProvider.getImage(imageId, false, false, false);
        if (image === null) {
            this.logger.error("no image found with the provided image_id", { imageId });
            throw new ErrorWithHTTPCode("Failed to delete user can manage image", httpStatus.NOT_FOUND);
        }

        const user = await this.userInfoProvider.getUser(userId);
        if (user === null) {
            this.logger.error("no user found with the provided user_id", { userId });
            throw new ErrorWithHTTPCode("Failed to delete user can manage image", httpStatus.NOT_FOUND);
        }

        const { error } = await promisifyGRPCCall(
            this.imageServiceDM.deleteUserCanManageImage.bind(this.imageServiceDM),
            { userId, imageId }
        );
        if (error !== null) {
            this.logger.error("failed to call image_service.deleteUserCanManageImage()", {
                userId,
                imageId,
                error,
            });
            throw new ErrorWithHTTPCode(
                "Failed to delete user can manage image",
                getHttpCodeFromGRPCStatus(error.code)
            );
        }
    }

    public async getUserCanVerifyImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        offset: number,
        limit: number
    ): Promise<{ totalUserCount: number; userList: User[] }> {
        const canUserAccessImage = await this.manageSelfAndAllCanEditChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed get user can manage image list", httpStatus.FORBIDDEN);
        }

        const { error, response } = await promisifyGRPCCall(
            this.imageServiceDM.getUserCanVerifyImageListOfImageId.bind(this.imageServiceDM),
            { imageId, offset, limit }
        );
        if (error !== null) {
            this.logger.error("failed to call image_service.getUserVerifyImageListOfImageId()", { error, imageId });
            throw new ErrorWithHTTPCode(
                "Failed to get user can manage image list",
                getHttpCodeFromGRPCStatus(error.code)
            );
        }

        const totalUserCount = response?.totalUserCount || 0;

        const userList: User[] = [];
        if (response?.userCanVerifyImageList !== undefined) {
            for (const item of response.userCanVerifyImageList) {
                const user = await this.userInfoProvider.getUser(item.userId || 0);
                if (user === null) {
                    this.logger.info("user with user_id not found", { userId: item.userId });
                    continue;
                }

                userList.push(User.fromProto(user));
            }
        }

        return { totalUserCount, userList };
    }

    public async createUserCanVerifyImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        userId: number
    ): Promise<User> {
        const canUserAccessImage = await this.manageSelfAndAllCanEditChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to create user can verify image", httpStatus.FORBIDDEN);
        }

        const { image } = await this.imageInfoProvider.getImage(imageId, false, false, false);
        if (image === null) {
            this.logger.error("no image found with the provided image_id", { imageId });
            throw new ErrorWithHTTPCode("Failed to create user can verify image", httpStatus.NOT_FOUND);
        }

        const user = await this.userInfoProvider.getUser(userId);
        if (user === null) {
            this.logger.error("no user found with the provided user_id", { userId });
            throw new ErrorWithHTTPCode("Failed to create user can verify image", httpStatus.NOT_FOUND);
        }

        const { error } = await promisifyGRPCCall(
            this.imageServiceDM.createUserCanVerifyImage.bind(this.imageServiceDM),
            { userId, imageId }
        );
        if (error !== null) {
            this.logger.error("failed to call image_service.createUserCanVerifyImage()", { userId, imageId, error });
            throw new ErrorWithHTTPCode(
                "Failed to create user can verify image",
                getHttpCodeFromGRPCStatus(error.code)
            );
        }

        return User.fromProto(user);
    }

    public async deleteUserCanVerifyImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        userId: number
    ): Promise<void> {
        const canUserAccessImage = await this.manageSelfAndAllCanEditChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to delete user can verify image", httpStatus.FORBIDDEN);
        }

        const { image } = await this.imageInfoProvider.getImage(imageId, false, false, false);
        if (image === null) {
            this.logger.error("no image found with the provided image_id", { imageId });
            throw new ErrorWithHTTPCode("Failed to delete user can verify image", httpStatus.NOT_FOUND);
        }

        const user = await this.userInfoProvider.getUser(userId);
        if (user === null) {
            this.logger.error("no user found with the provided user_id", { userId });
            throw new ErrorWithHTTPCode("Failed to delete user can verify image", httpStatus.NOT_FOUND);
        }

        const { error } = await promisifyGRPCCall(
            this.imageServiceDM.deleteUserCanVerifyImage.bind(this.imageServiceDM),
            { userId, imageId }
        );
        if (error !== null) {
            this.logger.error("failed to call image_service.deleteUserCanVerifyImage()", { userId, imageId, error });
            throw new ErrorWithHTTPCode(
                "Failed to delete user can verify image",
                getHttpCodeFromGRPCStatus(error.code)
            );
        }
    }

    public async deleteImage(authenticatedUserInfo: AuthenticatedUserInformation, imageId: number): Promise<void> {
        const canUserAccessImage = await this.manageSelfAndAllCanEditChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to delete image", httpStatus.FORBIDDEN);
        }

        const { error: deleteImageError } = await promisifyGRPCCall(
            this.imageServiceDM.deleteImage.bind(this.imageServiceDM),
            { id: imageId }
        );
        if (deleteImageError !== null) {
            this.logger.error("failed to call image_service.deleteImage()", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to delete image", getHttpCodeFromGRPCStatus(deleteImageError.code));
        }
    }

    public async addPointOfInterestToImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        coordinate: Vertex,
        description: string
    ): Promise<PointOfInterest> {
        const canUserAccessImage = await this.manageSelfAndAllCanEditAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to delete image", httpStatus.FORBIDDEN);
        }

        const { error, response } = await promisifyGRPCCall(
            this.imageServiceDM.createPointOfInterest.bind(this.imageServiceDM),
            {
                ofImageId: imageId,
                createdByUserId: authenticatedUserInfo.user.id,
                coordinate: coordinate,
                description: description,
            }
        );
        if (error !== null) {
            this.logger.error("failed to call image_service.createPointOfInterest", {
                ofImageId: imageId,
                createdByUserId: authenticatedUserInfo.user.id,
                coordinate: coordinate,
                description: description,
                error: error,
            });
            throw ErrorWithHTTPCode.wrapWithStatus(error, getHttpCodeFromGRPCStatus(error.code));
        }

        const poi = await this.poiProtoToPOIConverter.convert(response?.poi);
        return poi;
    }

    public async updatePointOfInterestOfImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        poiId: number,
        coordinate: Vertex,
        description: string
    ): Promise<PointOfInterest> {
        const canUserAccessImage = await this.manageSelfAndAllCanEditAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to delete image", httpStatus.FORBIDDEN);
        }

        const { error, response } = await promisifyGRPCCall(
            this.imageServiceDM.updatePointOfInterest.bind(this.imageServiceDM),
            {
                ofImageId: imageId,
                id: poiId,
                createdByUserId: authenticatedUserInfo.user.id,
                coordinate: coordinate,
                description: description,
            }
        );
        if (error !== null) {
            this.logger.error("failed to call image_service.updatePointOfInterest", {
                ofImageId: imageId,
                id: poiId,
                createdByUserId: authenticatedUserInfo.user.id,
                coordinate: coordinate,
                description: description,
                error: error,
            });
            throw ErrorWithHTTPCode.wrapWithStatus(error, getHttpCodeFromGRPCStatus(error.code));
        }

        const poi = await this.poiProtoToPOIConverter.convert(response?.poi);
        return poi;
    }

    public async deletePointOfInterestOfImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        poiId: number
    ): Promise<void> {
        const canUserAccessImage = await this.manageSelfAndAllCanEditAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageId
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to delete image", httpStatus.FORBIDDEN);
        }

        const { error } = await promisifyGRPCCall(this.imageServiceDM.deletePointOfInterest.bind(this.imageServiceDM), {
            ofImageId: imageId,
            id: poiId,
            createdByUserId: authenticatedUserInfo.user.id,
        });
        if (error !== null) {
            this.logger.error("failed to call image_service.deletePointOfInterest", {
                ofImageId: imageId,
                id: poiId,
                createdByUserId: authenticatedUserInfo.user.id,
                error: error,
            });
            throw ErrorWithHTTPCode.wrapWithStatus(error, getHttpCodeFromGRPCStatus(error.code));
        }
    }
}

injected(
    ImageManagementOperatorImpl,
    IMAGE_INFO_PROVIDER_TOKEN,
    USER_INFO_PROVIDER_TOKEN,
    MANAGE_SELF_AND_ALL_CAN_EDIT_CHECKER_TOKEN,
    MANAGE_SELF_AND_ALL_AND_VERIFY_CHECKER_TOKEN,
    MANAGE_SELF_AND_ALL_CAN_EDIT_AND_VERIFY_CHECKER_TOKEN,
    VERIFY_CHECKER_TOKEN,
    IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN,
    REGION_PROTO_TO_REGION_CONVERTER_TOKEN,
    IMAGE_STATUS_TO_IMAGE_STATUS_PROTO_CONVERTER_TOKEN,
    POINT_OF_INTEREST_PROTO_TO_POINT_OF_INTEREST_CONVERTER_TOKEN,
    IMAGE_SERVICE_DM_TOKEN,
    MODEL_SERVICE_DM_TOKEN,
    LOGGER_TOKEN
);

export const IMAGE_MANAGEMENT_OPERATOR_TOKEN = token<ImageManagementOperator>("ImageManagementOperator");
