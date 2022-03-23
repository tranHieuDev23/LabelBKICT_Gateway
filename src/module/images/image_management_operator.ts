import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import {
    IMAGE_SERVICE_DM_TOKEN,
    USER_SERVICE_DM_TOKEN,
} from "../../dataaccess/grpc";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { UserServiceClient } from "../../proto/gen/UserService";
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
} from "./image_permission_checker";
import { _ImageStatus_Values } from "../../proto/gen/ImageStatus";
import {
    ImageInfoProvider,
    IMAGE_INFO_PROVIDER_TOKEN,
} from "../info_providers";

export class ImageListFilterOptions {
    public imageTypeIDList: number[] = [];
    public imageTagIDList: number[] = [];
    public regionLabelIDList: number[] = [];
    public uploadedByUserIDList: number[] = [];
    public publishedByUserIDList: number[] = [];
    public verifiedByUserIDList: number[] = [];
    public uploadTimeStart = 0;
    public uploadTimeEnd = 0;
    public publishTimeStart = 0;
    public publishTimeEnd = 0;
    public verifyTimeStart = 0;
    public verifyTimeEnd = 0;
    public originalFileNameQuery = "";
    public imageStatusList: ImageStatus[] = [];
    public mustMatchAllImageTags = false;
    public mustMatchAllRegionLabels = false;
}

export interface ImageManagementOperator {
    createImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageTypeID: number | undefined,
        imageTagIDList: number[],
        originalFileName: string,
        description: string,
        imageData: Buffer
    ): Promise<Image>;
    updateImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIDList: number[],
        imageTypeID: number
    ): Promise<void>;
    deleteImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIDList: number[]
    ): Promise<void>;
    getImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number
    ): Promise<{
        image: Image;
        imageTagList: ImageTag[];
        regionList: Region[];
    }>;
    getImageRegionSnapshotList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        atStatus: ImageStatus
    ): Promise<Region[]>;
    updateImageMetadata(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        description: string | undefined
    ): Promise<Image>;
    updateImageType(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        imageTypeID: number
    ): Promise<Image>;
    updateImageStatus(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        status: ImageStatus
    ): Promise<Image>;
    addImageTagToImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        imageTagID: number
    ): Promise<void>;
    removeImageTagFromImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        imageTagID: number
    ): Promise<void>;
    deleteImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number
    ): Promise<void>;
    getUserImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{
        imageList: Image[];
        imageTagList: ImageTag[][];
    }>;
    getUserManageableImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{
        imageList: Image[];
        imageTagList: ImageTag[][];
    }>;
    getUserVerifiableImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{
        imageList: Image[];
        imageTagList: ImageTag[][];
    }>;
    getUserExportableImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{
        imageList: Image[];
        imageTagList: ImageTag[][];
    }>;
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
        imageTypeID: number | undefined,
        imageTagIDList: number[],
        originalFileName: string,
        description: string,
        imageData: Buffer
    ): Promise<Image> {
        const { error: createImageError, response: createImageTypeResponse } =
            await promisifyGRPCCall(
                this.imageServiceDM.createImage.bind(this.imageServiceDM),
                {
                    uploadedByUserId: authenticatedUserInfo.user.id,
                    imageTypeId: imageTypeID,
                    originalFileName: originalFileName,
                    description: description,
                    imageData: imageData,
                    imageTagIdList: imageTagIDList,
                }
            );
        if (createImageError !== null) {
            this.logger.error("failed to call image_service.createImage()", {
                error: createImageError,
            });
            throw new ErrorWithHTTPCode(
                "failed to create new image type",
                getHttpCodeFromGRPCStatus(createImageError.code)
            );
        }

        const imageProto = createImageTypeResponse?.image;
        return await this.imageProtoToImageConverter.convert(imageProto);
    }

    public async updateImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIDList: number[],
        imageTypeID: number
    ): Promise<void> {
        for (const imageID of imageIDList) {
            const { image } = await this.imageInfoProvider.getImage(
                imageID,
                false,
                false
            );
            if (
                !this.managePermissionChecker.checkUserHasPermissionForImage(
                    authenticatedUserInfo,
                    image
                )
            ) {
                this.logger.error("user is not allowed to access image", {
                    userID: authenticatedUserInfo.user.id,
                    imageID,
                });
                throw new ErrorWithHTTPCode(
                    "Failed to update image list",
                    httpStatus.FORBIDDEN
                );
            }
        }

        const { error: updateImageListImageTypeError } =
            await promisifyGRPCCall(
                this.imageServiceDM.updateImageListImageType.bind(
                    this.imageServiceDM
                ),
                { imageIdList: imageIDList, imageTypeId: imageTypeID }
            );
        if (updateImageListImageTypeError !== null) {
            this.logger.error("failed to call updateImageListImageType()", {
                error: updateImageListImageTypeError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to update image list",
                getHttpCodeFromGRPCStatus(updateImageListImageTypeError.code)
            );
        }
    }

    public async deleteImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIDList: number[]
    ): Promise<void> {
        for (const imageID of imageIDList) {
            const { image } = await this.imageInfoProvider.getImage(
                imageID,
                false,
                false
            );
            if (
                !this.managePermissionChecker.checkUserHasPermissionForImage(
                    authenticatedUserInfo,
                    image
                )
            ) {
                this.logger.error("user is not allowed to access image", {
                    userID: authenticatedUserInfo.user.id,
                    imageID,
                });
                throw new ErrorWithHTTPCode(
                    "Failed to delete image list",
                    httpStatus.FORBIDDEN
                );
            }
        }

        const { error: deleteImageListError } = await promisifyGRPCCall(
            this.imageServiceDM.deleteImageList.bind(this.imageServiceDM),
            { idList: imageIDList }
        );
        if (deleteImageListError !== null) {
            this.logger.error("failed to call deleteImageList()", {
                error: deleteImageListError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to delete image list",
                getHttpCodeFromGRPCStatus(deleteImageListError.code)
            );
        }
    }

    public async getImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number
    ): Promise<{
        image: Image;
        imageTagList: ImageTag[];
        regionList: Region[];
    }> {
        const {
            image: imageProto,
            imageTagList: imageTagProtoList,
            regionList: regionProtoList,
        } = await this.imageInfoProvider.getImage(imageID, true, true);
        if (
            !this.manageAndVerifyPermissionChecker.checkUserHasPermissionForImage(
                authenticatedUserInfo,
                imageProto
            )
        ) {
            this.logger.error("user is not allowed to access image", {
                userID: authenticatedUserInfo.user.id,
                imageID,
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
        imageID: number,
        atStatus: ImageStatus
    ): Promise<Region[]> {
        const { image: imageProto } = await this.imageInfoProvider.getImage(
            imageID,
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
                userID: authenticatedUserInfo.user.id,
                imageID,
            });
            throw new ErrorWithHTTPCode(
                "Failed to get image",
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
            { ofImageId: imageID, atStatus: atStatus }
        );
        if (getRegionSnapshotListOfImageError !== null) {
            this.logger.error("failed to call getRegionSnapshotListOfImage()", {
                error: getRegionSnapshotListOfImageError,
            });
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
        imageID: number,
        description: string | undefined
    ): Promise<Image> {
        const { image: imageProto } = await this.imageInfoProvider.getImage(
            imageID,
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
                userID: authenticatedUserInfo.user.id,
                imageID,
            });
            throw new ErrorWithHTTPCode(
                "Failed to get image",
                httpStatus.FORBIDDEN
            );
        }

        const {
            error: updateImageMetadataError,
            response: updateImageMetadataResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.updateImageMetadata.bind(this.imageServiceDM),
            { id: imageID, description: description }
        );
        if (updateImageMetadataError !== null) {
            this.logger.error("failed to call updateImageMetadata()", {
                error: updateImageMetadataError,
            });
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
        imageID: number,
        imageTypeID: number
    ): Promise<Image> {
        const { image: imageProto } = await this.imageInfoProvider.getImage(
            imageID,
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
                userID: authenticatedUserInfo.user.id,
                imageID,
            });
            throw new ErrorWithHTTPCode(
                "Failed to get image",
                httpStatus.FORBIDDEN
            );
        }

        const {
            error: updateImageImageTypeError,
            response: updateImageImageTypeResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.updateImageImageType.bind(this.imageServiceDM),
            { id: imageID, imageTypeId: imageTypeID }
        );
        if (updateImageImageTypeError !== null) {
            this.logger.error("failed to call updateImageImageType()", {
                error: updateImageImageTypeError,
            });
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
        imageID: number,
        status: ImageStatus
    ): Promise<Image> {
        const { image: imageProto } = await this.imageInfoProvider.getImage(
            imageID,
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
                userID: authenticatedUserInfo.user.id,
                imageID,
            });
            throw new ErrorWithHTTPCode(
                "Failed to get image",
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
            { id: imageID, status: statusProto }
        );
        if (updateImageStatusError !== null) {
            this.logger.error("failed to call updateImageStatus()", {
                error: updateImageStatusError,
            });
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
        imageID: number,
        imageTagID: number
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async removeImageTagFromImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        imageTagID: number
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async deleteImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async getUserImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{ imageList: Image[]; imageTagList: ImageTag[][] }> {
        throw new Error("Method not implemented.");
    }

    public async getUserManageableImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{ imageList: Image[]; imageTagList: ImageTag[][] }> {
        throw new Error("Method not implemented.");
    }

    public async getUserVerifiableImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{ imageList: Image[]; imageTagList: ImageTag[][] }> {
        throw new Error("Method not implemented.");
    }

    public async getUserExportableImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{ imageList: Image[]; imageTagList: ImageTag[][] }> {
        throw new Error("Method not implemented.");
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
