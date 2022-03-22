import { injected, token } from "brandi";
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
import { Image, ImageStatus, ImageTag, ImageType, Region } from "../schemas";

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
    constructor(
        private readonly userServiceDM: UserServiceClient,
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
        return new Image(
            imageProto?.id || 0,
            authenticatedUserInfo.user,
            imageProto?.uploadTime || 0,
            null,
            0,
            null,
            0,
            imageProto?.originalFileName || "",
            this.getOriginalImageFileURL(
                imageProto?.originalImageFilename || ""
            ),
            this.getThumbnailImageFileURL(
                imageProto?.thumbnailImageFilename || ""
            ),
            imageProto?.description || "",
            imageProto?.imageType
                ? ImageType.fromProto(imageProto.imageType)
                : null,
            ImageStatus.UPLOADED
        );
    }

    public async updateImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIDList: number[],
        imageTypeID: number
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async deleteImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIDList: number[]
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async getImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number
    ): Promise<{
        image: Image;
        imageTagList: ImageTag[];
        regionList: Region[];
    }> {
        throw new Error("Method not implemented.");
    }

    public async getImageRegionSnapshotList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        atStatus: ImageStatus
    ): Promise<Region[]> {
        throw new Error("Method not implemented.");
    }

    public async updateImageMetadata(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        description: string | undefined
    ): Promise<Image> {
        throw new Error("Method not implemented.");
    }

    public async updateImageType(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        imageTypeID: number
    ): Promise<Image> {
        throw new Error("Method not implemented.");
    }

    public async updateImageStatus(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        status: ImageStatus
    ): Promise<Image> {
        throw new Error("Method not implemented.");
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

    private getOriginalImageFileURL(originalImageFilename: string): string {
        return `/static/${originalImageFilename}`;
    }

    private getThumbnailImageFileURL(thumbnailFilename: string): string {
        return `/static/${thumbnailFilename}`;
    }
}

injected(
    ImageManagementOperatorImpl,
    USER_SERVICE_DM_TOKEN,
    IMAGE_SERVICE_DM_TOKEN,
    LOGGER_TOKEN
);

export const IMAGE_MANAGEMENT_OPERATOR_TOKEN = token<ImageManagementOperator>(
    "ImageManagementOperator"
);
