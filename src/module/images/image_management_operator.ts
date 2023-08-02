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
} from "../schemas";
import {
    MANAGE_SELF_AND_ALL_AND_VERIFY_CHECKER_TOKEN,
    MANAGE_SELF_AND_ALL_CAN_EDIT_AND_VERIFY_CHECKER_TOKEN,
    MANAGE_SELF_AND_ALL_CAN_EDIT_CHECKER_TOKEN,
    ImagePermissionChecker,
} from "../image_permissions";
import { ImageInfoProvider, IMAGE_INFO_PROVIDER_TOKEN } from "../info_providers";
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
        canEdit: boolean;
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
    deleteImage(authenticatedUserInfo: AuthenticatedUserInformation, imageId: number): Promise<void>;
}

export class ImageManagementOperatorImpl implements ImageManagementOperator {
    constructor(
        private readonly imageInfoProvider: ImageInfoProvider,
        private readonly manageSelfAndAllCanEditChecker: ImagePermissionChecker,
        private readonly manageSelfAndAllAndVerifyChecker: ImagePermissionChecker,
        private readonly manageSelfAndAllCanEditAndVerifyChecker: ImagePermissionChecker,
        private readonly imageProtoToImageConverter: ImageProtoToImageConverter,
        private readonly regionProtoToRegionConverter: RegionProtoToRegionConverter,
        private readonly imageStatusToImageStatusProtoConverter: ImageStatusToImageStatusProtoConverter,
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
        canEdit: boolean;
    }> {
        const {
            image: imageProto,
            imageTagList: imageTagProtoList,
            regionList: regionProtoList,
        } = await this.imageInfoProvider.getImage(imageId, true, true);

        const canUserAccessImage = await this.manageSelfAndAllAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageProto
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
        const canEdit = await this.manageSelfAndAllCanEditAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageProto
        );

        return { image, imageTagList, regionList, canEdit };
    }

    public async getImageRegionSnapshotList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        atStatus: ImageStatus
    ): Promise<Region[]> {
        const { image: imageProto } = await this.imageInfoProvider.getImage(imageId, false, false);
        const canUserAccessImage = await this.manageSelfAndAllAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageProto
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
        const { image: imageProto } = await this.imageInfoProvider.getImage(imageId, false, false);
        const canUserAccessImage = await this.manageSelfAndAllCanEditAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageProto
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
        const { image: imageProto } = await this.imageInfoProvider.getImage(imageId, false, false);
        const canUserAccessImage = await this.manageSelfAndAllCanEditAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageProto
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
        const { image: imageProto } = await this.imageInfoProvider.getImage(imageId, false, false);
        const canUserAccessImage = await this.manageSelfAndAllCanEditAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageProto
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
        const { image: imageProto } = await this.imageInfoProvider.getImage(imageId, false, false);
        const canUserAccessImage = await this.manageSelfAndAllCanEditAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageProto
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
        const { image: imageProto } = await this.imageInfoProvider.getImage(imageId, false, false);
        const canUserAccessImage = await this.manageSelfAndAllCanEditAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageProto
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
        const { image: imageProto } = await this.imageInfoProvider.getImage(imageId, false, false);
        const canUserAccessImage = await this.manageSelfAndAllCanEditChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageProto
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
        const { image: imageProto } = await this.imageInfoProvider.getImage(imageId, false, false);
        const canUserAccessImage = await this.manageSelfAndAllAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageProto
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
        const { image: imageProto } = await this.imageInfoProvider.getImage(imageId, false, false);
        const canUserAccessImage = await this.manageSelfAndAllAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageProto
        );
        if (!canUserAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode("Failed to get image bookmark", httpStatus.FORBIDDEN);
        }

        const { error: getImageBookmarkError, response: getImageBookmarkResponse } = await promisifyGRPCCall(
            this.imageServiceDM.getImageBookmark.bind(this.imageServiceDM),
            {
                userId: authenticatedUserInfo.user.id,
                imageId: imageId,
            }
        );
        if (getImageBookmarkError !== null) {
            if (getImageBookmarkError.code === status.NOT_FOUND) {
                this.logger.error("user has not yet bookmarked the image", {
                    userId: authenticatedUserInfo.user.id,
                    imageId,
                });
                throw new ErrorWithHTTPCode("Failed to get image bookmark", httpStatus.CONFLICT);
            }

            this.logger.error("failed to call image_service.getImageBookmark()", { error: getImageBookmarkError });
            throw new ErrorWithHTTPCode(
                "Failed to get image bookmark",
                getHttpCodeFromGRPCStatus(getImageBookmarkError.code)
            );
        }

        return ImageBookmark.fromProto(getImageBookmarkResponse?.imageBookmark);
    }

    public async updateImageBookmark(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        description: string
    ): Promise<ImageBookmark> {
        const { image: imageProto } = await this.imageInfoProvider.getImage(imageId, false, false);
        const canUserAccessImage = await this.manageSelfAndAllAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageProto
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
        const { image: imageProto } = await this.imageInfoProvider.getImage(imageId, false, false);
        const canUserAccessImage = await this.manageSelfAndAllAndVerifyChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageProto
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

    public async deleteImage(authenticatedUserInfo: AuthenticatedUserInformation, imageId: number): Promise<void> {
        const { image: imageProto } = await this.imageInfoProvider.getImage(imageId, false, false);
        const canUserAccessImage = await this.manageSelfAndAllCanEditChecker.checkUserHasPermissionForImage(
            authenticatedUserInfo,
            imageProto
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
}

injected(
    ImageManagementOperatorImpl,
    IMAGE_INFO_PROVIDER_TOKEN,
    MANAGE_SELF_AND_ALL_CAN_EDIT_CHECKER_TOKEN,
    MANAGE_SELF_AND_ALL_AND_VERIFY_CHECKER_TOKEN,
    MANAGE_SELF_AND_ALL_CAN_EDIT_AND_VERIFY_CHECKER_TOKEN,
    IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN,
    REGION_PROTO_TO_REGION_CONVERTER_TOKEN,
    IMAGE_STATUS_TO_IMAGE_STATUS_PROTO_CONVERTER_TOKEN,
    IMAGE_SERVICE_DM_TOKEN,
    MODEL_SERVICE_DM_TOKEN,
    LOGGER_TOKEN
);

export const IMAGE_MANAGEMENT_OPERATOR_TOKEN = token<ImageManagementOperator>("ImageManagementOperator");
