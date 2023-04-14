import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { IMAGE_SERVICE_DM_TOKEN, MODEL_SERVICE_DM_TOKEN, USER_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { ModelServiceClient } from "../../proto/gen/ModelService";
import { AuthenticatedUserInformation } from "../../service/utils";
import { ErrorWithHTTPCode, getHttpCodeFromGRPCStatus, LOGGER_TOKEN, promisifyGRPCCall } from "../../utils";
import {
    Image,
    ImageListFilterOptions,
    ImageProtoToImageConverter,
    ImageTag,
    IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN,
    User,
    FilterOptionsToFilterOptionsProtoConverter,
    FILTER_OPTIONS_TO_FILTER_OPTIONS_PROTO_CONVERTER,
    ClassificationType,
    ClassificationTypeToClassificationTypeProtoConverter,
    CLASSIFICATION_TYPE_TO_CLASSIFICATION_TYPE_PROTO_CONVERTER_TOKEN
} from "../schemas";
import {
    MANAGE_SELF_AND_ALL_AND_VERIFY_CHECKER_TOKEN,
    MANAGE_SELF_AND_ALL_CAN_EDIT_CHECKER_TOKEN,
    ImagePermissionChecker,
    MANAGE_SELF_AND_ALL_CAN_EDIT_AND_VERIFY_CHECKER_TOKEN,
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
import {
    UserManageableImageFilterOptionsProvider,
    USER_MANAGEABLE_IMAGE_FILTER_OPTIONS_PROVIDER,
} from "./user_manageable_image_filter_options_provider";
import {
    UserVerifiableImageFilterOptionsProvider,
    USER_VERIFIABLE_IMAGE_FILTER_OPTIONS_PROVIDER,
} from "./user_verifiable_image_filter_options_provider";

export interface ImageListManagementOperator {
    updateImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIdList: number[],
        imageTypeId: number
    ): Promise<void>;
    deleteImageList(authenticatedUserInfo: AuthenticatedUserInformation, imageIdList: number[]): Promise<void>;
    createImageDetectionTaskList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIdList: number[]
    ): Promise<void>;
    createImageClassificationTaskList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIdList: number[],
        classificationType: ClassificationType
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
    addImageTagListToImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIdList: number[],
        imageTagIdList: number[]
    ): Promise<void>;
}

export class ImageListManagementOperatorImpl implements ImageListManagementOperator {
    constructor(
        private readonly imageInfoProvider: ImageInfoProvider,
        private readonly userCanManageUserImageInfoProvider: UserCanManageUserImageInfoProvider,
        private readonly userCanVerifyUserImageInfoProvider: UserCanVerifyUserImageInfoProvider,
        private readonly manageSelfAndAllCanEditChecker: ImagePermissionChecker,
        private readonly manageSelfAndAllAndVerifyChecker: ImagePermissionChecker,
        private readonly manageSelfAndAllCanEditAndVerifyChecker: ImagePermissionChecker,
        private readonly imageProtoToImageConverter: ImageProtoToImageConverter,
        private readonly filterOptionsToFilterOptionsProto: FilterOptionsToFilterOptionsProtoConverter,
        private readonly userManageableImageFilterOptionsProvider: UserManageableImageFilterOptionsProvider,
        private readonly userVerifiableImageFilterOptionsProvider: UserVerifiableImageFilterOptionsProvider,
        private readonly classificationTypeToClassificationTypeProtoConverter: ClassificationTypeToClassificationTypeProtoConverter,
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
        const { imageList } = await this.imageInfoProvider.getImageList(imageIdList, false, false);
        const canUserAccessImageList = await this.manageSelfAndAllCanEditChecker.checkUserHasPermissionForImageList(
            authenticatedUserInfo,
            imageList
        );
        if (!canUserAccessImageList) {
            this.logger.error("user is not allowed to access image list", {
                userId: authenticatedUserInfo.user.id,
            });
            throw new ErrorWithHTTPCode("Failed to update image list", httpStatus.FORBIDDEN);
        }

        const { error: updateImageListImageTypeError } = await promisifyGRPCCall(
            this.imageServiceDM.updateImageListImageType.bind(this.imageServiceDM),
            { imageIdList: imageIdList, imageTypeId: imageTypeId }
        );
        if (updateImageListImageTypeError !== null) {
            this.logger.error("failed to call image_service.updateImageListImageType()", {
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
        imageIdList: number[]
    ): Promise<void> {
        const { imageList } = await this.imageInfoProvider.getImageList(imageIdList, false, false);
        const canUserAccessImageList = await this.manageSelfAndAllCanEditChecker.checkUserHasPermissionForImageList(
            authenticatedUserInfo,
            imageList
        );
        if (!canUserAccessImageList) {
            this.logger.error("user is not allowed to access image list", {
                userId: authenticatedUserInfo.user.id,
            });
            throw new ErrorWithHTTPCode("Failed to delete image list", httpStatus.FORBIDDEN);
        }

        const { error: deleteImageListError } = await promisifyGRPCCall(
            this.imageServiceDM.deleteImageList.bind(this.imageServiceDM),
            { idList: imageIdList }
        );
        if (deleteImageListError !== null) {
            this.logger.error("failed to call image_service.deleteImageList()", { error: deleteImageListError });
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
        const { imageList } = await this.imageInfoProvider.getImageList(imageIdList, false, false);
        const canUserAccessImageList = await this.manageSelfAndAllCanEditChecker.checkUserHasPermissionForImageList(
            authenticatedUserInfo,
            imageList
        );
        if (!canUserAccessImageList) {
            this.logger.error("user is not allowed to access image list", {
                userId: authenticatedUserInfo.user.id,
            });
            throw new ErrorWithHTTPCode("Failed to create detection task for image list", httpStatus.FORBIDDEN);
        }

        const { error: createDetectionTaskBatchError } = await promisifyGRPCCall(
            this.modelServiceDM.CreateDetectionTaskBatch.bind(this.modelServiceDM),
            { imageIdList: imageIdList }
        );
        if (createDetectionTaskBatchError !== null) {
            this.logger.error("failed to call model_service.createDetectionTask()", {
                error: createDetectionTaskBatchError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to create detection task for image list",
                getHttpCodeFromGRPCStatus(createDetectionTaskBatchError.code)
            );
        }
    }

    public async createImageClassificationTaskList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIdList: number[],
        classificationType: ClassificationType
    ): Promise<void> {
        const { imageList } = await this.imageInfoProvider.getImageList(imageIdList, false, false);
        const canUserAccessImageList = await this.manageSelfAndAllCanEditChecker.checkUserHasPermissionForImageList(
            authenticatedUserInfo,
            imageList
        );
        if (!canUserAccessImageList) {
            this.logger.error("user is not allowed to access image list", {
                userId: authenticatedUserInfo.user.id,
            });
            throw new ErrorWithHTTPCode("Failed to create classification task for image list", httpStatus.FORBIDDEN);
        }

        const classificationTypeProto =
            this.classificationTypeToClassificationTypeProtoConverter.convert(classificationType);

        const { error: createClassificationTaskBatchError } = await promisifyGRPCCall(
            this.modelServiceDM.CreateClassificationTaskBatch.bind(this.modelServiceDM),
            { imageIdList: imageIdList, classificationType: classificationTypeProto }
        );
        
        if (createClassificationTaskBatchError !== null) {
            this.logger.error("failed to call model_service.createClassificationTask()", {
                error: createClassificationTaskBatchError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to create classification task for image list",
                getHttpCodeFromGRPCStatus(createClassificationTaskBatchError.code)
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
        const filterOptionsProto = this.filterOptionsToFilterOptionsProto.convertImageFilterOptions(
            authenticatedUserInfo,
            filterOptions
        );
        filterOptionsProto.uploadedByUserIdList = [authenticatedUserInfo.user.id];
        const { error: getImageListError, response: getImageListResponse } = await promisifyGRPCCall(
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
        const imageTagListOfImageList = getImageListResponse?.imageTagListOfImageList || [];
        const imageTagProtoList = imageTagListOfImageList.map((imageTagList) => imageTagList.imageTagList || []);

        const imageList = await Promise.all(
            imageProtoList.map((imageProto) => this.imageProtoToImageConverter.convert(imageProto))
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
        const manageableImageUserIdList =
            await this.userCanManageUserImageInfoProvider.getManageableUserImageUserIdListOfUserId(
                authenticatedUserInfo.user.id
            );
        const { error: searchUserError, response: searchUserResponse } = await promisifyGRPCCall(
            this.userServiceDM.searchUser.bind(this.userServiceDM),
            {
                query,
                limit,
                includedUserIdList: manageableImageUserIdList,
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
        const filterOptionsProto =
            await this.userManageableImageFilterOptionsProvider.getUserManageableImageFilterOptionsProto(
                authenticatedUserInfo,
                filterOptions
            );
        const { error: getImageListError, response: getImageListResponse } = await promisifyGRPCCall(
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
        const imageTagListOfImageList = getImageListResponse?.imageTagListOfImageList || [];
        const imageTagProtoList = imageTagListOfImageList.map((imageTagList) => imageTagList.imageTagList || []);

        const imageList = await Promise.all(
            imageProtoList.map((imageProto) => this.imageProtoToImageConverter.convert(imageProto))
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
        const verifiableImageUserIdList =
            await this.userCanVerifyUserImageInfoProvider.getVerifiableUserImageUserIdListOfUserId(
                authenticatedUserInfo.user.id
            );
        const { error: searchUserError, response: searchUserResponse } = await promisifyGRPCCall(
            this.userServiceDM.searchUser.bind(this.userServiceDM),
            {
                query,
                limit,
                includedUserIdList: verifiableImageUserIdList,
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
        const filterOptionsProto =
            await this.userVerifiableImageFilterOptionsProvider.getUserVerifiableImageFilterOptionsProto(
                authenticatedUserInfo,
                filterOptions
            );

        const { error: getImageListError, response: getImageListResponse } = await promisifyGRPCCall(
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
        const imageTagListOfImageList = getImageListResponse?.imageTagListOfImageList || [];
        const imageTagProtoList = imageTagListOfImageList.map((imageTagList) => imageTagList.imageTagList || []);

        const imageList = await Promise.all(
            imageProtoList.map((imageProto) => this.imageProtoToImageConverter.convert(imageProto))
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
        const manageableImageUserIdList =
            await this.userCanManageUserImageInfoProvider.getManageableUserImageUserIdListOfUserId(
                authenticatedUserInfo.user.id
            );
        const { error: searchUserError, response: searchUserResponse } = await promisifyGRPCCall(
            this.userServiceDM.searchUser.bind(this.userServiceDM),
            {
                query,
                limit,
                includedUserIdList: manageableImageUserIdList,
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
            await this.userManageableImageFilterOptionsProvider.getUserManageableImageFilterOptionsProto(
                authenticatedUserInfo,
                filterOptions
            );

        const { error: getImageListError, response: getImageListResponse } = await promisifyGRPCCall(
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
        const imageTagListOfImageList = getImageListResponse?.imageTagListOfImageList || [];
        const imageTagProtoList = imageTagListOfImageList.map((imageTagList) => imageTagList.imageTagList || []);

        const imageList = await Promise.all(
            imageProtoList.map((imageProto) => this.imageProtoToImageConverter.convert(imageProto))
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
            throw new ErrorWithHTTPCode("Failed to get image", httpStatus.FORBIDDEN);
        }

        const filterOptionsProto = this.filterOptionsToFilterOptionsProto.convertImageFilterOptions(
            authenticatedUserInfo,
            filterOptions
        );
        const { error: getImagePositionInListError, response: getImagePositionInListResponse } =
            await promisifyGRPCCall(this.imageServiceDM.getImagePositionInList.bind(this.imageServiceDM), {
                id: imageId,
                sortOrder: sortOrder,
                filterOptions: filterOptionsProto,
            });
        if (getImagePositionInListError !== null) {
            this.logger.error("failed to call image_service.getImagePositionInList()");
            throw new ErrorWithHTTPCode(
                "Failed to get image position in list",
                getHttpCodeFromGRPCStatus(getImagePositionInListError.code)
            );
        }

        const position = getImagePositionInListResponse?.position || 0;
        const totalImageCount = getImagePositionInListResponse?.totalImageCount || 0;
        const prevImageId = getImagePositionInListResponse?.prevImageId;
        const nextImageId = getImagePositionInListResponse?.nextImageId;
        return { position, totalImageCount, prevImageId, nextImageId };
    }

    public async addImageTagListToImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIdList: number[],
        imageTagIdList: number[]
    ): Promise<void> {
        const { imageList } = await this.imageInfoProvider.getImageList(imageIdList, false, false);
        const canUserAccessImageList =
            await this.manageSelfAndAllCanEditAndVerifyChecker.checkUserHasPermissionForImageList(
                authenticatedUserInfo,
                imageList
            );
        if (!canUserAccessImageList) {
            this.logger.error("user is not allowed to access image list", {
                userId: authenticatedUserInfo.user.id,
            });
            throw new ErrorWithHTTPCode("Failed to update image list", httpStatus.FORBIDDEN);
        }

        const { error: addImageTagListToImageListError } = await promisifyGRPCCall(
            this.imageServiceDM.addImageTagListToImageList.bind(this.imageServiceDM),
            { imageIdList, imageTagIdList }
        );
        if (addImageTagListToImageListError !== null) {
            this.logger.error("failed to call image_service.addImageTagListToImageList()", {
                userId: authenticatedUserInfo.user.id,
                imageIdList,
            });
            throw new ErrorWithHTTPCode(
                "Failed to add image tag list to image list",
                getHttpCodeFromGRPCStatus(addImageTagListToImageListError.code)
            );
        }
    }
}

injected(
    ImageListManagementOperatorImpl,
    IMAGE_INFO_PROVIDER_TOKEN,
    USER_CAN_MANAGE_USER_IMAGE_INFO_PROVIDER_TOKEN,
    USER_CAN_VERIFY_USER_IMAGE_INFO_PROVIDER_TOKEN,
    MANAGE_SELF_AND_ALL_CAN_EDIT_CHECKER_TOKEN,
    MANAGE_SELF_AND_ALL_AND_VERIFY_CHECKER_TOKEN,
    MANAGE_SELF_AND_ALL_CAN_EDIT_AND_VERIFY_CHECKER_TOKEN,
    IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN,
    FILTER_OPTIONS_TO_FILTER_OPTIONS_PROTO_CONVERTER,
    USER_MANAGEABLE_IMAGE_FILTER_OPTIONS_PROVIDER,
    USER_VERIFIABLE_IMAGE_FILTER_OPTIONS_PROVIDER,
    CLASSIFICATION_TYPE_TO_CLASSIFICATION_TYPE_PROTO_CONVERTER_TOKEN,
    USER_SERVICE_DM_TOKEN,
    IMAGE_SERVICE_DM_TOKEN,
    MODEL_SERVICE_DM_TOKEN,
    LOGGER_TOKEN
);

export const IMAGE_LIST_MANAGEMENT_OPERATOR_TOKEN = token<ImageListManagementOperator>("ImageListManagementOperator");
