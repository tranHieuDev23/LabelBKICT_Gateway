import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import {
    IMAGE_SERVICE_DM_TOKEN,
    USER_SERVICE_DM_TOKEN,
} from "../../dataaccess/grpc";
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
    ImageTag,
    IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN,
    User,
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
import { UserServiceClient } from "../../proto/gen/UserService";

export class ImageListFilterOptions {
    public imageTypeIdList: number[] = [];
    public imageTagIdList: number[] = [];
    public regionLabelIdList: number[] = [];
    public uploadedByUserIdList: number[] = [];
    public publishedByUserIdList: number[] = [];
    public verifiedByUserIdList: number[] = [];
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

export interface ImageListManagementOperator {
    updateImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIdList: number[],
        imageTypeId: number
    ): Promise<void>;
    deleteImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIdList: number[]
    ): Promise<void>;
    getUserImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{
        totalImageCount: number;
        imageList: Image[];
        imageTagList: ImageTag[][];
    }>;
    getUserManageableImageUserList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        query: string,
        limit: number
    ): Promise<User[]>;
    getUserManageableImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{
        totalImageCount: number;
        imageList: Image[];
        imageTagList: ImageTag[][];
    }>;
    getUserVerifiableImageUserList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        query: string,
        limit: number
    ): Promise<User[]>;
    getUserVerifiableImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{
        totalImageCount: number;
        imageList: Image[];
        imageTagList: ImageTag[][];
    }>;
    getUserExportableImageUserList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        query: string,
        limit: number
    ): Promise<User[]>;
    getUserExportableImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{
        totalImageCount: number;
        imageList: Image[];
        imageTagList: ImageTag[][];
    }>;
    getImagePositionInList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{
        position: number;
        totalImageCount: number;
        prevImageId: number | undefined;
        nextImageId: number | undefined;
    }>;
}

export class ImageListManagementOperatorImpl
    implements ImageListManagementOperator
{
    private readonly managePermissionChecker = new ImagesManageSelfChecker(
        new ImagesManageAllChecker(null)
    );
    private readonly manageAndVerifyPermissionChecker =
        new ImagesVerifyAllChecker(this.managePermissionChecker);

    constructor(
        private readonly imageInfoProvider: ImageInfoProvider,
        private readonly imageProtoToImageConverter: ImageProtoToImageConverter,
        private readonly userServiceDM: UserServiceClient,
        private readonly imageServiceDM: ImageServiceClient,
        private readonly logger: Logger
    ) {}

    public async updateImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIdList: number[],
        imageTypeId: number
    ): Promise<void> {
        for (const imageId of imageIdList) {
            const { image } = await this.imageInfoProvider.getImage(
                imageId,
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
                    userId: authenticatedUserInfo.user.id,
                    imageId,
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
                { imageIdList: imageIdList, imageTypeId: imageTypeId }
            );
        if (updateImageListImageTypeError !== null) {
            this.logger.error(
                "failed to call image_service.updateImageListImageType()",
                { error: updateImageListImageTypeError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to update image list",
                getHttpCodeFromGRPCStatus(updateImageListImageTypeError.code)
            );
        }
    }

    public async deleteImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIdList: number[]
    ): Promise<void> {
        for (const imageId of imageIdList) {
            const { image } = await this.imageInfoProvider.getImage(
                imageId,
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
                    userId: authenticatedUserInfo.user.id,
                    imageId,
                });
                throw new ErrorWithHTTPCode(
                    "Failed to delete image list",
                    httpStatus.FORBIDDEN
                );
            }
        }

        const { error: deleteImageListError } = await promisifyGRPCCall(
            this.imageServiceDM.deleteImageList.bind(this.imageServiceDM),
            { idList: imageIdList }
        );
        if (deleteImageListError !== null) {
            this.logger.error(
                "failed to call image_service.deleteImageList()",
                { error: deleteImageListError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to delete image list",
                getHttpCodeFromGRPCStatus(deleteImageListError.code)
            );
        }
    }

    public async getUserImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{
        totalImageCount: number;
        imageList: Image[];
        imageTagList: ImageTag[][];
    }> {
        filterOptions.uploadedByUserIdList = [authenticatedUserInfo.user.id];
        const { error: getImageListError, response: getImageListResponse } =
            await promisifyGRPCCall(
                this.imageServiceDM.getImageList.bind(this.imageServiceDM),
                { offset, limit, sortOrder, filterOptions, withImageTag: true }
            );
        if (getImageListError !== null) {
            this.logger.error("failed to call image_service.getImageList()");
            throw new ErrorWithHTTPCode(
                "Failed to get user's image list",
                getHttpCodeFromGRPCStatus(getImageListError.code)
            );
        }

        const totalImageCount = getImageListResponse?.totalImageCount || 0;
        const imageProtoList = getImageListResponse?.imageList || [];
        const imageTagListOfImageList =
            getImageListResponse?.imageTagListOfImageList || [];
        const imageTagProtoList = imageTagListOfImageList.map(
            (imageTagList) => imageTagList.imageTagList || []
        );

        const imageList = await Promise.all(
            imageProtoList.map((imageProto) =>
                this.imageProtoToImageConverter.convert(imageProto)
            )
        );
        const imageTagList = imageTagProtoList.map((imageTagProtoSublist) =>
            imageTagProtoSublist.map(ImageTag.fromProto)
        );

        return { totalImageCount, imageList, imageTagList };
    }

    public async getUserManageableImageUserList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        query: string,
        limit: number
    ): Promise<User[]> {
        const { error: searchUserError, response: searchUserResponse } =
            await promisifyGRPCCall(
                this.userServiceDM.searchUser.bind(this.userServiceDM),
                { query, limit }
            );
        if (searchUserError !== null) {
            this.logger.error("failed to call user_service.searchUser()", {
                error: searchUserError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to get user list with manageable images",
                getHttpCodeFromGRPCStatus(searchUserError.code)
            );
        }

        const userProtoList = searchUserResponse?.userList || [];
        return userProtoList.map((userProto) => User.fromProto(userProto));
    }

    public async getUserManageableImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{
        totalImageCount: number;
        imageList: Image[];
        imageTagList: ImageTag[][];
    }> {
        const { error: getImageListError, response: getImageListResponse } =
            await promisifyGRPCCall(
                this.imageServiceDM.getImageList.bind(this.imageServiceDM),
                { offset, limit, sortOrder, filterOptions, withImageTag: true }
            );
        if (getImageListError !== null) {
            this.logger.error("failed to call image_service.getImageList()");
            throw new ErrorWithHTTPCode(
                "Failed to get user's manageable image list",
                getHttpCodeFromGRPCStatus(getImageListError.code)
            );
        }

        const totalImageCount = getImageListResponse?.totalImageCount || 0;
        const imageProtoList = getImageListResponse?.imageList || [];
        const imageTagListOfImageList =
            getImageListResponse?.imageTagListOfImageList || [];
        const imageTagProtoList = imageTagListOfImageList.map(
            (imageTagList) => imageTagList.imageTagList || []
        );

        const imageList = await Promise.all(
            imageProtoList.map((imageProto) =>
                this.imageProtoToImageConverter.convert(imageProto)
            )
        );
        const imageTagList = imageTagProtoList.map((imageTagProtoSublist) =>
            imageTagProtoSublist.map(ImageTag.fromProto)
        );

        return { totalImageCount, imageList, imageTagList };
    }

    public async getUserVerifiableImageUserList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        query: string,
        limit: number
    ): Promise<User[]> {
        const { error: searchUserError, response: searchUserResponse } =
            await promisifyGRPCCall(
                this.userServiceDM.searchUser.bind(this.userServiceDM),
                { query, limit }
            );
        if (searchUserError !== null) {
            this.logger.error("failed to call user_service.searchUser()", {
                error: searchUserError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to get user list with verifiable images",
                getHttpCodeFromGRPCStatus(searchUserError.code)
            );
        }

        const userProtoList = searchUserResponse?.userList || [];
        return userProtoList.map((userProto) => User.fromProto(userProto));
    }

    public async getUserVerifiableImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{
        totalImageCount: number;
        imageList: Image[];
        imageTagList: ImageTag[][];
    }> {
        filterOptions.imageStatusList = [ImageStatus.PUBLISHED];
        const { error: getImageListError, response: getImageListResponse } =
            await promisifyGRPCCall(
                this.imageServiceDM.getImageList.bind(this.imageServiceDM),
                { offset, limit, sortOrder, filterOptions, withImageTag: true }
            );
        if (getImageListError !== null) {
            this.logger.error("failed to call image_service.getImageList()");
            throw new ErrorWithHTTPCode(
                "Failed to get user's verifiable image list",
                getHttpCodeFromGRPCStatus(getImageListError.code)
            );
        }

        const totalImageCount = getImageListResponse?.totalImageCount || 0;
        const imageProtoList = getImageListResponse?.imageList || [];
        const imageTagListOfImageList =
            getImageListResponse?.imageTagListOfImageList || [];
        const imageTagProtoList = imageTagListOfImageList.map(
            (imageTagList) => imageTagList.imageTagList || []
        );

        const imageList = await Promise.all(
            imageProtoList.map((imageProto) =>
                this.imageProtoToImageConverter.convert(imageProto)
            )
        );
        const imageTagList = imageTagProtoList.map((imageTagProtoSublist) =>
            imageTagProtoSublist.map(ImageTag.fromProto)
        );

        return { totalImageCount, imageList, imageTagList };
    }

    public async getUserExportableImageUserList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        query: string,
        limit: number
    ): Promise<User[]> {
        const { error: searchUserError, response: searchUserResponse } =
            await promisifyGRPCCall(
                this.userServiceDM.searchUser.bind(this.userServiceDM),
                { query, limit }
            );
        if (searchUserError !== null) {
            this.logger.error("failed to call user_service.searchUser()", {
                error: searchUserError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to get user list with exportable images",
                getHttpCodeFromGRPCStatus(searchUserError.code)
            );
        }

        const userProtoList = searchUserResponse?.userList || [];
        return userProtoList.map((userProto) => User.fromProto(userProto));
    }

    public async getUserExportableImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{
        totalImageCount: number;
        imageList: Image[];
        imageTagList: ImageTag[][];
    }> {
        const { error: getImageListError, response: getImageListResponse } =
            await promisifyGRPCCall(
                this.imageServiceDM.getImageList.bind(this.imageServiceDM),
                { offset, limit, sortOrder, filterOptions, withImageTag: true }
            );
        if (getImageListError !== null) {
            this.logger.error("failed to call image_service.getImageList()");
            throw new ErrorWithHTTPCode(
                "Failed to get user's exportable image list",
                getHttpCodeFromGRPCStatus(getImageListError.code)
            );
        }

        const totalImageCount = getImageListResponse?.totalImageCount || 0;
        const imageProtoList = getImageListResponse?.imageList || [];
        const imageTagListOfImageList =
            getImageListResponse?.imageTagListOfImageList || [];
        const imageTagProtoList = imageTagListOfImageList.map(
            (imageTagList) => imageTagList.imageTagList || []
        );

        const imageList = await Promise.all(
            imageProtoList.map((imageProto) =>
                this.imageProtoToImageConverter.convert(imageProto)
            )
        );
        const imageTagList = imageTagProtoList.map((imageTagProtoSublist) =>
            imageTagProtoSublist.map(ImageTag.fromProto)
        );

        return { totalImageCount, imageList, imageTagList };
    }

    public async getImagePositionInList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{
        position: number;
        totalImageCount: number;
        prevImageId: number | undefined;
        nextImageId: number | undefined;
    }> {
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
                "Failed to get image",
                httpStatus.FORBIDDEN
            );
        }

        const {
            error: getImagePositionInListError,
            response: getImagePositionInListResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.getImagePositionInList.bind(
                this.imageServiceDM
            ),
            {
                id: imageId,
                sortOrder: sortOrder,
                filterOptions,
            }
        );
        if (getImagePositionInListError !== null) {
            this.logger.error(
                "failed to call image_service.getImagePositionInList()"
            );
            throw new ErrorWithHTTPCode(
                "Failed to get image position in list",
                getHttpCodeFromGRPCStatus(getImagePositionInListError.code)
            );
        }

        const position = getImagePositionInListResponse?.position || 0;
        const totalImageCount =
            getImagePositionInListResponse?.totalImageCount || 0;
        const prevImageId = getImagePositionInListResponse?.prevImageId;
        const nextImageId = getImagePositionInListResponse?.nextImageId;
        return { position, totalImageCount, prevImageId, nextImageId };
    }
}

injected(
    ImageListManagementOperatorImpl,
    IMAGE_INFO_PROVIDER_TOKEN,
    IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN,
    USER_SERVICE_DM_TOKEN,
    IMAGE_SERVICE_DM_TOKEN,
    LOGGER_TOKEN
);

export const IMAGE_LIST_MANAGEMENT_OPERATOR_TOKEN =
    token<ImageListManagementOperator>("ImageListManagementOperator");
