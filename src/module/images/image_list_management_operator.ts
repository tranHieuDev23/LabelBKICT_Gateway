import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { DUPLICATE_IMAGE_DETECTION_SERVICE_DM_TOKEN, IMAGE_SERVICE_DM_TOKEN, MODEL_SERVICE_DM_TOKEN, USER_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { ModelServiceClient } from "../../proto/gen/ModelService";
import { DuplicateImageDetectionServiceClient } from "../../proto/gen/DuplicateImageDetectionService";
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
    PHashingValue,
    DetectionTaskProtoToDetectionTaskConverter,
    DETECTION_TASK_PROTO_TO_DETECTION_TASK_CONVERTER_TOKEN,
} from "../schemas";
import {
    MANAGE_SELF_AND_ALL_CAN_EDIT_CHECKER_TOKEN,
    ImagePermissionChecker,
    MANAGE_SELF_AND_ALL_CAN_EDIT_AND_VERIFY_CHECKER_TOKEN,
    MANAGE_SELF_AND_ALL_CHECKER_TOKEN,
    VERIFY_CHECKER_TOKEN,
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
import { DetectionTask } from "../schemas/detection_task";
import { _DetectionTaskStatus_Values } from "../../proto/gen/DetectionTaskStatus";

export interface ImageListManagementOperator {
    updateImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIdList: number[],
        imageTypeId: number
    ): Promise<void>;
    deleteImageList(authenticatedUserInfo: AuthenticatedUserInformation, imageIdList: number[]): Promise<void>;
    getImageDetectionTaskList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{
        totalDetectionTaskCount: number;
        detectionTaskList: DetectionTask[];
    }>;
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
    getImagePositionInUserManageableImageList(
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
    getImagePositionInUserVerifiableImageList(
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
    addImageTagListToImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIdList: number[],
        imageTagIdList: number[]
    ): Promise<void>;
    getDuplicateImageIdList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number
    ): Promise<number[]>;
    getDuplicateImageIdListofImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIdList: number[]
    ): Promise<number[][]>;
}

export class ImageListManagementOperatorImpl implements ImageListManagementOperator {
    constructor(
        private readonly imageInfoProvider: ImageInfoProvider,
        private readonly userCanManageUserImageInfoProvider: UserCanManageUserImageInfoProvider,
        private readonly userCanVerifyUserImageInfoProvider: UserCanVerifyUserImageInfoProvider,
        private readonly manageSelfAndAllChecker: ImagePermissionChecker,
        private readonly manageSelfAndAllCanEditChecker: ImagePermissionChecker,
        private readonly verifyChecker: ImagePermissionChecker,
        private readonly manageSelfAndAllCanEditAndVerifyChecker: ImagePermissionChecker,
        private readonly imageProtoToImageConverter: ImageProtoToImageConverter,
        private readonly filterOptionsToFilterOptionsProto: FilterOptionsToFilterOptionsProtoConverter,
        private readonly detectionTaskProtoToDetectionTaskConverter: DetectionTaskProtoToDetectionTaskConverter,
        private readonly userManageableImageFilterOptionsProvider: UserManageableImageFilterOptionsProvider,
        private readonly userVerifiableImageFilterOptionsProvider: UserVerifiableImageFilterOptionsProvider,
        private readonly userServiceDM: UserServiceClient,
        private readonly imageServiceDM: ImageServiceClient,
        private readonly modelServiceDM: ModelServiceClient,
        private readonly duplicateImageDetectionServiceDM: DuplicateImageDetectionServiceClient,
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

    public async getImageDetectionTaskList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{
        totalDetectionTaskCount: number;
        detectionTaskList: DetectionTask[];
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
                limit: undefined,
                sortOrder,
                filterOptions: filterOptionsProto,
            }
        );
        if (getImageListError !== null) {
            this.logger.error("failed to call image_service.getImageList()", { error: getImageListError });
            throw new ErrorWithHTTPCode(
                "Failed to get user's manageable image list",
                getHttpCodeFromGRPCStatus(getImageListError.code)
            );
        }

        const imageList = getImageListResponse?.imageList || [];
        const imageIdToThumbnailImageFileNameMap = new Map<number, string>();
        for (const image of imageList) {
            imageIdToThumbnailImageFileNameMap.set(image.id || 0, image.thumbnailImageFilename || "");
        }

        const { error: getDetectionTaskListError, response: getDetectionTaskListResponse } = await promisifyGRPCCall(
            this.modelServiceDM.getDetectionTaskList.bind(this.modelServiceDM),
            {
                offset,
                limit,
                ofImageIdList: Array.from(imageIdToThumbnailImageFileNameMap.keys()),
                statusList: [_DetectionTaskStatus_Values.REQUESTED, _DetectionTaskStatus_Values.PROCESSING],
                sortOrder: sortOrder,
            }
        );
        if (getDetectionTaskListError !== null) {
            this.logger.error("failed to call model_service.getDetectionTaskList()", {
                error: getDetectionTaskListError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to get user's manageable image list",
                getHttpCodeFromGRPCStatus(getDetectionTaskListError.code)
            );
        }

        const totalDetectionTaskCount = getDetectionTaskListResponse?.totalDetectionTaskCount || 0;
        const detectionTaskList: DetectionTask[] = [];
        for (const detectionTask of getDetectionTaskListResponse?.detectionTaskList || []) {
            const thumbnailImageFileName = imageIdToThumbnailImageFileNameMap.get(detectionTask.ofImageId || 0);
            if (thumbnailImageFileName === undefined) {
                this.logger.error("image not found for detection task", { detectionTask });
                throw new ErrorWithHTTPCode("Internal server error", httpStatus.INTERNAL_SERVER_ERROR);
            }

            detectionTaskList.push(
                this.detectionTaskProtoToDetectionTaskConverter.convert(detectionTask, thumbnailImageFileName)
            );
        }

        return { totalDetectionTaskCount, detectionTaskList };
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
            this.logger.error("failed to call image_service.getImageList()", { error: getImageListError });
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
        limit: number | undefined,
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
            this.logger.error("failed to call image_service.getImageList()", { error: getImageListError });
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

    public async getImagePositionInUserManageableImageList(
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
        const canUserAccessImage = await this.manageSelfAndAllChecker.checkUserHasPermissionForImage(
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

        const filterOptionsProto =
            await this.userManageableImageFilterOptionsProvider.getUserManageableImageFilterOptionsProto(
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
            this.logger.error("failed to call image_service.getImageList()", { error: getImageListError });
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

    public async getImagePositionInUserVerifiableImageList(
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
        const canUserAccessImage = await this.verifyChecker.checkUserHasPermissionForImage(
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

        const filterOptionsProto =
            await this.userVerifiableImageFilterOptionsProvider.getUserVerifiableImageFilterOptionsProto(
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
            this.logger.error("failed to call image_service.getImageList()", { error: getImageListError });
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

    public async getDuplicateImageIdList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number
    ): Promise<number[]> {
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
            throw new ErrorWithHTTPCode("Failed to get image", httpStatus.FORBIDDEN);
        }

        const { 
            error: getDuplicateImageIdListError,
            response: getDuplicateImageIdListResponse
        } = await promisifyGRPCCall(
            this.duplicateImageDetectionServiceDM.getDuplicateImageIdList.bind(this.duplicateImageDetectionServiceDM),
            { imageId: imageId }
        );

        if (getDuplicateImageIdListError !== null) {
            this.logger.error("failed to call duplicate_image_detection_service.getDuplicateImageIdList()", {
                userId: authenticatedUserInfo.user.id
            });
            throw new ErrorWithHTTPCode(
                "Failed to get duplicated imageId list",
                getHttpCodeFromGRPCStatus(getDuplicateImageIdListError.code)
            );
        }
        return getDuplicateImageIdListResponse?.duplicateImageIdList || [];
    }

    public async getDuplicateImageIdListofImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIdList: number[]
    ): Promise<number[][]> {
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
        
        const {
            error: getPHashingValueListOfImageIdListError,
            response: getPHashingValueListOfImageIdListResponse
        } = await promisifyGRPCCall(
            this.duplicateImageDetectionServiceDM.getPHashingValueListOfImageIdList.bind(this.duplicateImageDetectionServiceDM),
            { imageIdList: imageIdList }
        );

        if (getPHashingValueListOfImageIdListError !== null) {
            this.logger.error("failed to call duplicate_image_detection_service.getPHashingValueListOfImageIdList()", {
                userId: authenticatedUserInfo.user.id
            });
            throw new ErrorWithHTTPCode(
                "Failed to get pHashing value list",
                getHttpCodeFromGRPCStatus(getPHashingValueListOfImageIdListError.code)
            );
        }
        
        const pHashingValueListOfImageIdList = getPHashingValueListOfImageIdListResponse?.duplicateImageIdListOfImageIdList || [];
        const pHashingValueProtoList = pHashingValueListOfImageIdList.map((pHashingValueList) => pHashingValueList.ofImageIdList || []);
        
        // const pHashingValueList = pHashingValueProtoList.map((pHashingValueProtoSubList) =>
        //     pHashingValueProtoSubList.map(PHashingValue.fromProto)
        // );
        return pHashingValueProtoList;
    }
}

injected(
    ImageListManagementOperatorImpl,
    IMAGE_INFO_PROVIDER_TOKEN,
    USER_CAN_MANAGE_USER_IMAGE_INFO_PROVIDER_TOKEN,
    USER_CAN_VERIFY_USER_IMAGE_INFO_PROVIDER_TOKEN,
    MANAGE_SELF_AND_ALL_CHECKER_TOKEN,
    MANAGE_SELF_AND_ALL_CAN_EDIT_CHECKER_TOKEN,
    VERIFY_CHECKER_TOKEN,
    MANAGE_SELF_AND_ALL_CAN_EDIT_AND_VERIFY_CHECKER_TOKEN,
    IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN,
    FILTER_OPTIONS_TO_FILTER_OPTIONS_PROTO_CONVERTER,
    DETECTION_TASK_PROTO_TO_DETECTION_TASK_CONVERTER_TOKEN,
    USER_MANAGEABLE_IMAGE_FILTER_OPTIONS_PROVIDER,
    USER_VERIFIABLE_IMAGE_FILTER_OPTIONS_PROVIDER,
    USER_SERVICE_DM_TOKEN,
    IMAGE_SERVICE_DM_TOKEN,
    MODEL_SERVICE_DM_TOKEN,
    DUPLICATE_IMAGE_DETECTION_SERVICE_DM_TOKEN,
    LOGGER_TOKEN
);

export const IMAGE_LIST_MANAGEMENT_OPERATOR_TOKEN = token<ImageListManagementOperator>("ImageListManagementOperator");
