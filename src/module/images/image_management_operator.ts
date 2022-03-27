import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { IMAGE_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { AuthenticatedUserInformation } from "../../service/utils";
import {
    ErrorWithHTTPCode,
    getHttpCodeFromGRPCStatus,
    LOGGER_TOKEN,
    promisifyGRPCCall,
} from "../../utils";
import {
    Image,
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
    ImagesManageAllChecker,
    ImagesManageSelfChecker,
    ImagesVerifyAllChecker,
} from "../image_permissions";
import {
    ImageInfoProvider,
    IMAGE_INFO_PROVIDER_TOKEN,
} from "../info_providers";

export interface ImageManagementOperator {
    createImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageTypeId: number | undefined,
        imageTagIdList: number[],
        originalFileName: string,
        description: string,
        imageData: Buffer
    ): Promise<Image>;
    getImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number
    ): Promise<{
        image: Image;
        imageTagList: ImageTag[];
        regionList: Region[];
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
    deleteImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number
    ): Promise<void>;
}

export class ImageManagementOperatorImpl implements ImageManagementOperator {
    private readonly managePermissionChecker = new ImagesManageSelfChecker(
        new ImagesManageAllChecker(null)
    );
    private readonly manageAndVerifyPermissionChecker =
        new ImagesVerifyAllChecker(this.managePermissionChecker);

    constructor(
        private readonly imageInfoProvider: ImageInfoProvider,
        private readonly imageProtoToImageConverter: ImageProtoToImageConverter,
        private readonly regionProtoToRegionConverter: RegionProtoToRegionConverter,
        private readonly imageStatusToImageStatusProtoConverter: ImageStatusToImageStatusProtoConverter,
        private readonly imageServiceDM: ImageServiceClient,
        private readonly logger: Logger
    ) {}

    public async createImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageTypeId: number | undefined,
        imageTagIdList: number[],
        originalFileName: string,
        description: string,
        imageData: Buffer
    ): Promise<Image> {
        const { error: createImageError, response: createImageTypeResponse } =
            await promisifyGRPCCall(
                this.imageServiceDM.createImage.bind(this.imageServiceDM),
                {
                    uploadedByUserId: authenticatedUserInfo.user.id,
                    imageTypeId: imageTypeId,
                    originalFileName: originalFileName,
                    description: description,
                    imageData: imageData,
                    imageTagIdList: imageTagIdList,
                }
            );
        if (createImageError !== null) {
            this.logger.error(
                "failed to call image_service.image_service.createImage()",
                { error: createImageError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to create new image",
                getHttpCodeFromGRPCStatus(createImageError.code)
            );
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
    }> {
        const {
            image: imageProto,
            imageTagList: imageTagProtoList,
            regionList: regionProtoList,
        } = await this.imageInfoProvider.getImage(imageId, true, true);
        if (
            !this.manageAndVerifyPermissionChecker.checkUserHasPermissionForImage(
                authenticatedUserInfo,
                imageProto
            )
        ) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode(
                "Failed to get image",
                httpStatus.FORBIDDEN
            );
        }

        const image = await this.imageProtoToImageConverter.convert(imageProto);
        const imageTagList = (imageTagProtoList || []).map(ImageTag.fromProto);
        const regionList = await Promise.all(
            (regionProtoList || []).map((regionProto) =>
                this.regionProtoToRegionConverter.convert(regionProto)
            )
        );
        return { image, imageTagList, regionList };
    }

    public async getImageRegionSnapshotList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        atStatus: ImageStatus
    ): Promise<Region[]> {
        const { image: imageProto } = await this.imageInfoProvider.getImage(
            imageId,
            false,
            false
        );
        if (
            !this.manageAndVerifyPermissionChecker.checkUserHasPermissionForImage(
                authenticatedUserInfo,
                imageProto
            )
        ) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode(
                "Failed to get region snapshot list of image",
                httpStatus.FORBIDDEN
            );
        }

        const {
            error: getRegionSnapshotListOfImageError,
            response: getRegionSnapshotListOfImageResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.getRegionSnapshotListOfImage.bind(
                this.imageServiceDM
            ),
            { ofImageId: imageId, atStatus: atStatus }
        );
        if (getRegionSnapshotListOfImageError !== null) {
            this.logger.error(
                "failed to call image_service.getRegionSnapshotListOfImage()",
                { error: getRegionSnapshotListOfImageError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to get region snapshot list of image",
                getHttpCodeFromGRPCStatus(
                    getRegionSnapshotListOfImageError.code
                )
            );
        }

        const regionProtoList =
            getRegionSnapshotListOfImageResponse?.regionList || [];
        const regionList = await Promise.all(
            regionProtoList.map((regionProto) =>
                this.regionProtoToRegionConverter.convert(regionProto)
            )
        );
        return regionList;
    }

    public async updateImageMetadata(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        description: string | undefined
    ): Promise<Image> {
        const { image: imageProto } = await this.imageInfoProvider.getImage(
            imageId,
            false,
            false
        );
        if (
            !this.manageAndVerifyPermissionChecker.checkUserHasPermissionForImage(
                authenticatedUserInfo,
                imageProto
            )
        ) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode(
                "Failed to update metadata of image",
                httpStatus.FORBIDDEN
            );
        }

        const {
            error: updateImageMetadataError,
            response: updateImageMetadataResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.updateImageMetadata.bind(this.imageServiceDM),
            { id: imageId, description: description }
        );
        if (updateImageMetadataError !== null) {
            this.logger.error(
                "failed to call image_service.updateImageMetadata()",
                { error: updateImageMetadataError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to update metadata of image",
                getHttpCodeFromGRPCStatus(updateImageMetadataError.code)
            );
        }

        const updatedImageProto = updateImageMetadataResponse?.image;
        const updatedImage =
            this.imageProtoToImageConverter.convert(updatedImageProto);
        return updatedImage;
    }

    public async updateImageType(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        imageTypeId: number
    ): Promise<Image> {
        const { image: imageProto } = await this.imageInfoProvider.getImage(
            imageId,
            false,
            false
        );
        if (
            !this.manageAndVerifyPermissionChecker.checkUserHasPermissionForImage(
                authenticatedUserInfo,
                imageProto
            )
        ) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode(
                "Failed to update image type of image",
                httpStatus.FORBIDDEN
            );
        }

        const {
            error: updateImageImageTypeError,
            response: updateImageImageTypeResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.updateImageImageType.bind(this.imageServiceDM),
            { id: imageId, imageTypeId: imageTypeId }
        );
        if (updateImageImageTypeError !== null) {
            this.logger.error(
                "failed to call image_service.updateImageImageType()",
                { error: updateImageImageTypeError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to update image type of image",
                getHttpCodeFromGRPCStatus(updateImageImageTypeError.code)
            );
        }

        const updatedImageProto = updateImageImageTypeResponse?.image;
        const updatedImage =
            this.imageProtoToImageConverter.convert(updatedImageProto);
        return updatedImage;
    }

    public async updateImageStatus(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        status: ImageStatus
    ): Promise<Image> {
        const { image: imageProto } = await this.imageInfoProvider.getImage(
            imageId,
            false,
            false
        );
        if (
            !this.manageAndVerifyPermissionChecker.checkUserHasPermissionForImage(
                authenticatedUserInfo,
                imageProto
            )
        ) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode(
                "Failed to update status of image",
                httpStatus.FORBIDDEN
            );
        }

        const statusProto =
            this.imageStatusToImageStatusProtoConverter.convert(status);

        const {
            error: updateImageStatusError,
            response: updateImageStatusResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.updateImageStatus.bind(this.imageServiceDM),
            { id: imageId, status: statusProto }
        );
        if (updateImageStatusError !== null) {
            this.logger.error(
                "failed to call image_service.updateImageStatus()",
                { error: updateImageStatusError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to update status of image",
                getHttpCodeFromGRPCStatus(updateImageStatusError.code)
            );
        }

        const updatedImageProto = updateImageStatusResponse?.image;
        const updatedImage =
            this.imageProtoToImageConverter.convert(updatedImageProto);
        return updatedImage;
    }

    public async addImageTagToImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        imageTagId: number
    ): Promise<void> {
        const { image: imageProto } = await this.imageInfoProvider.getImage(
            imageId,
            false,
            false
        );
        if (
            !this.manageAndVerifyPermissionChecker.checkUserHasPermissionForImage(
                authenticatedUserInfo,
                imageProto
            )
        ) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode(
                "Failed to add image tag to image",
                httpStatus.FORBIDDEN
            );
        }

        const { error: addImageTagToImageError } = await promisifyGRPCCall(
            this.imageServiceDM.addImageTagToImage.bind(this.imageServiceDM),
            {
                imageId: imageId,
                imageTagId: imageTagId,
            }
        );
        if (addImageTagToImageError !== null) {
            this.logger.error(
                "failed to call image_service.addImageTagToImage()",
                {
                    userId: authenticatedUserInfo.user.id,
                    imageId,
                }
            );
            throw new ErrorWithHTTPCode(
                "Failed to add image tag to image",
                httpStatus.FORBIDDEN
            );
        }
    }

    public async removeImageTagFromImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        imageTagId: number
    ): Promise<void> {
        const { image: imageProto } = await this.imageInfoProvider.getImage(
            imageId,
            false,
            false
        );
        if (
            !this.manageAndVerifyPermissionChecker.checkUserHasPermissionForImage(
                authenticatedUserInfo,
                imageProto
            )
        ) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode(
                "Failed to remove image tag from image",
                httpStatus.FORBIDDEN
            );
        }

        const { error: removeImageTagFromImageError } = await promisifyGRPCCall(
            this.imageServiceDM.addImageTagToImage.bind(this.imageServiceDM),
            {
                imageId: imageId,
                imageTagId: imageTagId,
            }
        );
        if (removeImageTagFromImageError !== null) {
            this.logger.error(
                "failed to call image_service.removeImageTagFromImage()",
                {
                    userId: authenticatedUserInfo.user.id,
                    imageId,
                }
            );
            throw new ErrorWithHTTPCode(
                "Failed to remove image tag from image",
                httpStatus.FORBIDDEN
            );
        }
    }

    public async deleteImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number
    ): Promise<void> {
        const { image: imageProto } = await this.imageInfoProvider.getImage(
            imageId,
            false,
            false
        );
        if (
            !this.managePermissionChecker.checkUserHasPermissionForImage(
                authenticatedUserInfo,
                imageProto
            )
        ) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode(
                "Failed to delete image",
                httpStatus.FORBIDDEN
            );
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
            throw new ErrorWithHTTPCode(
                "Failed to delete image",
                httpStatus.FORBIDDEN
            );
        }
    }
}

injected(
    ImageManagementOperatorImpl,
    IMAGE_INFO_PROVIDER_TOKEN,
    IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN,
    REGION_PROTO_TO_REGION_CONVERTER_TOKEN,
    IMAGE_STATUS_TO_IMAGE_STATUS_PROTO_CONVERTER_TOKEN,
    IMAGE_SERVICE_DM_TOKEN,
    LOGGER_TOKEN
);

export const IMAGE_MANAGEMENT_OPERATOR_TOKEN = token<ImageManagementOperator>(
    "ImageManagementOperator"
);
