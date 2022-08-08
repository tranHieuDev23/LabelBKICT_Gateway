import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import {
    IMAGE_SERVICE_DM_TOKEN,
    MODEL_SERVICE_DM_TOKEN,
    USER_SERVICE_DM_TOKEN,
} from "../../dataaccess/grpc";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { ModelServiceClient } from "../../proto/gen/ModelService";
import { AuthenticatedUserInformation } from "../../service/utils";
import {
    ErrorWithHTTPCode,
    getHttpCodeFromGRPCStatus,
    LOGGER_TOKEN,
    promisifyGRPCCall,
} from "../../utils";
import {
    Image,
    ImageListFilterOptions,
    ImageProtoToImageConverter,
    ImageStatus,
    ImageTag,
    IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN,
    User,
    FilterOptionsToFilterOptionsProtoConverter,
    FILTER_OPTIONS_TO_FILTER_OPTIONS_PROTO_CONVERTER,
} from "../schemas";
import {
    MANAGE_SELF_AND_ALL_AND_VERIFY_CHECKER_TOKEN,
    MANAGE_SELF_AND_ALL_CAN_EDIT_CHECKER_TOKEN,
    ImagePermissionChecker,
} from "../image_permissions";
import {
    ImageInfoProvider,
    IMAGE_INFO_PROVIDER_TOKEN,
    UserCanManageUserImageInfoProvider,
    UserCanVerifyUserImageInfoProvider,
    USER_CAN_MANAGE_USER_IMAGE_INFO_PROVIDER_TOKEN,
    USER_CAN_VERIFY_USER_IMAGE_INFO_PROVIDER_TOKEN,
} from "../info_providers";
import { UserServiceClient } from "../../proto/gen/UserService";

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
    createImageDetectionTaskList(
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
    searchUserManageableImageUserList(
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
    searchUserVerifiableImageUserList(
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
    searchUserExportableImageUserList(
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
    constructor(
        private readonly imageInfoProvider: ImageInfoProvider,
        private readonly userCanManageUserImageInfoProvider: UserCanManageUserImageInfoProvider,
        private readonly userCanVerifyUserImageInfoProvider: UserCanVerifyUserImageInfoProvider,
        private readonly manageSelfAndAllCanEditChecker: ImagePermissionChecker,
        private readonly manageSelfAndAllAndVerifyChecker: ImagePermissionChecker,
        private readonly imageProtoToImageConverter: ImageProtoToImageConverter,
        private readonly filterOptionsToFilterOptionsProto: FilterOptionsToFilterOptionsProtoConverter,
        private readonly userServiceDM: UserServiceClient,
        private readonly imageServiceDM: ImageServiceClient,
        private readonly modelServiceDM: ModelServiceClient,
        private readonly logger: Logger
    ) {}

    public async updateImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIdList: number[],
        imageTypeId: number
    ): Promise<void> {
        const imageList = await Promise.all(
            imageIdList.map(async (imageId) => {
                const { image } = await this.imageInfoProvider.getImage(
                    imageId,
                    false,
                    false
                );
                return image;
            })
        );

        const canUserAccessImageList =
            await this.manageSelfAndAllCanEditChecker.checkUserHasPermissionForImageList(
                authenticatedUserInfo,
                imageList
            );
        if (!canUserAccessImageList) {
            this.logger.error("user is not allowed to access image list", {
                userId: authenticatedUserInfo.user.id,
            });
            throw new ErrorWithHTTPCode(
                "Failed to update image list",
                httpStatus.FORBIDDEN
            );
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
        const imageList = await Promise.all(
            imageIdList.map(async (imageId) => {
                const { image } = await this.imageInfoProvider.getImage(
                    imageId,
                    false,
                    false
                );
                return image;
            })
        );

        const canUserAccessImageList =
            await this.manageSelfAndAllCanEditChecker.checkUserHasPermissionForImageList(
                authenticatedUserInfo,
                imageList
            );
        if (!canUserAccessImageList) {
            this.logger.error("user is not allowed to access image list", {
                userId: authenticatedUserInfo.user.id,
            });
            throw new ErrorWithHTTPCode(
                "Failed to delete image list",
                httpStatus.FORBIDDEN
            );
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

    public async createImageDetectionTaskList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIdList: number[]
    ): Promise<void> {
        const imageList = await Promise.all(
            imageIdList.map(async (imageId) => {
                const { image } = await this.imageInfoProvider.getImage(
                    imageId,
                    false,
                    false
                );
                return image;
            })
        );

        const canUserAccessImageList =
            await this.manageSelfAndAllCanEditChecker.checkUserHasPermissionForImageList(
                authenticatedUserInfo,
                imageList
            );
        if (!canUserAccessImageList) {
            this.logger.error("user is not allowed to access image list", {
                userId: authenticatedUserInfo.user.id,
            });
            throw new ErrorWithHTTPCode(
                "Failed to delete image list",
                httpStatus.FORBIDDEN
            );
        }

        const { error: createDetectionTaskError } = await promisifyGRPCCall(
            this.modelServiceDM.CreateDetectionTaskBatch.bind(this.modelServiceDM),
            { imageIdList: imageIdList }
        );
        if (createDetectionTaskError !== null) {
            this.logger.error(
                "failed to call model_service.createDetectionTask()",
                { error: createDetectionTaskError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to create detection task for image(s)",
                getHttpCodeFromGRPCStatus(createDetectionTaskError.code)
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
        const filterOptionsProto =
            this.filterOptionsToFilterOptionsProto.convert(
                authenticatedUserInfo,
                filterOptions
            );
        filterOptionsProto.uploadedByUserIdList = [
            authenticatedUserInfo.user.id,
        ];
        const { error: getImageListError, response: getImageListResponse } =
            await promisifyGRPCCall(
                this.imageServiceDM.getImageList.bind(this.imageServiceDM),
                {
                    offset,
                    limit,
                    sortOrder,
                    filterOptions: filterOptionsProto,
                    withImageTag: true,
                }
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

    public async searchUserManageableImageUserList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        query: string,
        limit: number
    ): Promise<User[]> {
        const userId = authenticatedUserInfo.user.id;
        const userCanManageUserImageList =
            await this.userCanManageUserImageInfoProvider.getUserCanManageUserImageListOfUserId(
                userId
            );
        const userCanManageUserImageUserIdList = userCanManageUserImageList.map(
            (item) => item.imageOfUserId || 0
        );
        userCanManageUserImageUserIdList.push(userId);

        const { error: searchUserError, response: searchUserResponse } =
            await promisifyGRPCCall(
                this.userServiceDM.searchUser.bind(this.userServiceDM),
                {
                    query,
                    limit,
                    includedUserIdList: userCanManageUserImageUserIdList,
                }
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
        const userId = authenticatedUserInfo.user.id;
        const userCanManageUserImageList =
            await this.userCanManageUserImageInfoProvider.getUserCanManageUserImageListOfUserId(
                userId
            );
        const userCanManageUserImageUserIdList = userCanManageUserImageList.map(
            (item) => item.imageOfUserId || 0
        );

        let uploadedByUserIdList = filterOptions.uploaded_by_user_id_list;
        if (userCanManageUserImageUserIdList.length > 0) {
            uploadedByUserIdList = Array.from(
                new Set([
                    ...uploadedByUserIdList,
                    ...userCanManageUserImageUserIdList,
                    userId,
                ])
            );
        }

        const filterOptionsProto =
            this.filterOptionsToFilterOptionsProto.convert(
                authenticatedUserInfo,
                filterOptions
            );
        filterOptionsProto.uploadedByUserIdList = uploadedByUserIdList;

        const { error: getImageListError, response: getImageListResponse } =
            await promisifyGRPCCall(
                this.imageServiceDM.getImageList.bind(this.imageServiceDM),
                {
                    offset,
                    limit,
                    sortOrder,
                    filterOptions: filterOptionsProto,
                    withImageTag: true,
                }
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

    public async searchUserVerifiableImageUserList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        query: string,
        limit: number
    ): Promise<User[]> {
        const userId = authenticatedUserInfo.user.id;
        const userCanVerifyUserImageList =
            await this.userCanVerifyUserImageInfoProvider.getUserCanVerifyUserImageListOfUserId(
                userId
            );
        const userCanVerifyUserImageUserIdList = userCanVerifyUserImageList.map(
            (item) => item.imageOfUserId || 0
        );
        userCanVerifyUserImageUserIdList.push(userId);

        const { error: searchUserError, response: searchUserResponse } =
            await promisifyGRPCCall(
                this.userServiceDM.searchUser.bind(this.userServiceDM),
                {
                    query,
                    limit,
                    includedUserIdList: userCanVerifyUserImageUserIdList,
                }
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
        const userId = authenticatedUserInfo.user.id;
        const userCanVerifyUserImageList =
            await this.userCanVerifyUserImageInfoProvider.getUserCanVerifyUserImageListOfUserId(
                userId
            );
        const userCanVerifyUserImageUserIdList = userCanVerifyUserImageList.map(
            (item) => item.imageOfUserId || 0
        );

        let uploadedByUserIdList = filterOptions.uploaded_by_user_id_list;
        if (userCanVerifyUserImageUserIdList.length > 0) {
            uploadedByUserIdList = Array.from(
                new Set([
                    ...uploadedByUserIdList,
                    ...userCanVerifyUserImageUserIdList,
                    userId,
                ])
            );
        }

        const filterOptionsProto =
            this.filterOptionsToFilterOptionsProto.convert(
                authenticatedUserInfo,
                filterOptions
            );
        filterOptionsProto.uploadedByUserIdList = uploadedByUserIdList;
        filterOptionsProto.imageStatusList = [
            ImageStatus.PUBLISHED,
            ImageStatus.VERIFIED,
        ];

        const { error: getImageListError, response: getImageListResponse } =
            await promisifyGRPCCall(
                this.imageServiceDM.getImageList.bind(this.imageServiceDM),
                {
                    offset,
                    limit,
                    sortOrder,
                    filterOptions: filterOptionsProto,
                    withImageTag: true,
                }
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

    public async searchUserExportableImageUserList(
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
        const filterOptionsProto =
            this.filterOptionsToFilterOptionsProto.convert(
                authenticatedUserInfo,
                filterOptions
            );
        const { error: getImageListError, response: getImageListResponse } =
            await promisifyGRPCCall(
                this.imageServiceDM.getImageList.bind(this.imageServiceDM),
                {
                    offset,
                    limit,
                    sortOrder,
                    filterOptions: filterOptionsProto,
                    withImageTag: true,
                }
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

        const canUSerAccessImage =
            await this.manageSelfAndAllAndVerifyChecker.checkUserHasPermissionForImage(
                authenticatedUserInfo,
                imageProto
            );
        if (!canUSerAccessImage) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode(
                "Failed to get image",
                httpStatus.FORBIDDEN
            );
        }

        const filterOptionsProto =
            this.filterOptionsToFilterOptionsProto.convert(
                authenticatedUserInfo,
                filterOptions
            );
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
                filterOptions: filterOptionsProto,
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
    USER_CAN_MANAGE_USER_IMAGE_INFO_PROVIDER_TOKEN,
    USER_CAN_VERIFY_USER_IMAGE_INFO_PROVIDER_TOKEN,
    MANAGE_SELF_AND_ALL_CAN_EDIT_CHECKER_TOKEN,
    MANAGE_SELF_AND_ALL_AND_VERIFY_CHECKER_TOKEN,
    IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN,
    FILTER_OPTIONS_TO_FILTER_OPTIONS_PROTO_CONVERTER,
    USER_SERVICE_DM_TOKEN,
    IMAGE_SERVICE_DM_TOKEN,
    MODEL_SERVICE_DM_TOKEN,
    LOGGER_TOKEN
);

export const IMAGE_LIST_MANAGEMENT_OPERATOR_TOKEN =
    token<ImageListManagementOperator>("ImageListManagementOperator");
