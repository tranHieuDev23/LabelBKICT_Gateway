import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import {
    IMAGE_SERVICE_DM_TOKEN,
    USER_SERVICE_DM_TOKEN,
} from "../../dataaccess/grpc";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { _UserListSortOrder_Values } from "../../proto/gen/UserListSortOrder";
import { UserServiceClient } from "../../proto/gen/UserService";
import {
    ErrorWithHTTPCode,
    getHttpCodeFromGRPCStatus,
    LOGGER_TOKEN,
} from "../../utils";
import { promisifyGRPCCall } from "../../utils/grpc";
import { UserInfoProvider, USER_INFO_PROVIDER_TOKEN } from "../info_providers";
import {
    FilterOptionsToFilterOptionsProtoConverter,
    FILTER_OPTIONS_TO_FILTER_OPTIONS_PROTO_CONVERTER,
    User,
    UserCanManageUserImage,
    UserCanManageUserImageProtoToUserCanManageUserImage,
    UserCanVerifyUserImage,
    UserCanVerifyUserImageProtoToUserCanVerifyUserImage,
    UserListFilterOptions,
    UserRole,
    UserTag,
    USER_CAN_MANAGE_USER_IMAGE_PROTO_TO_USER_CAN_MANAGE_USER_IMAGE_TOKEN,
    USER_CAN_VERIFY_USER_IMAGE_PROTO_TO_USER_CAN_VERIFY_USER_IMAGE_TOKEN,
} from "../schemas";

export interface UserManagementOperator {
    createUser(
        username: string,
        displayName: string,
        password: string
    ): Promise<User>;
    getUserList(
        offset: number,
        limit: number,
        sortOrder: number,
        withUserRole: boolean,
        withUserTag: boolean,
        filterOptions: UserListFilterOptions
    ): Promise<{
        totalUserCount: number;
        userList: User[];
        userRoleList: UserRole[][] | undefined;
        userTagList: UserTag[][] | undefined;
    }>;
    searchUserList(query: string, limit: number): Promise<User[]>;
    updateUser(
        id: number,
        username: string | undefined,
        displayName: string | undefined,
        password: string | undefined
    ): Promise<User>;
    addUserCanManageUserImage(
        userId: number,
        imageOfUserId: number,
        canEdit: boolean
    ): Promise<UserCanManageUserImage>;
    getUserCanManageUserImageListOfUser(
        userId: number,
        offset: number,
        limit: number
    ): Promise<{ totalUserCount: number; userList: UserCanManageUserImage[] }>;
    updateUserCanManageUserImage(
        userId: number,
        imageOfUserId: number,
        canEdit: boolean | undefined
    ): Promise<UserCanManageUserImage>;
    deleteUserCanManageUserImage(
        userId: number,
        imageOfUserId: number
    ): Promise<void>;
    addUserCanVerifyUserImage(
        userId: number,
        imageOfUserId: number
    ): Promise<UserCanVerifyUserImage>;
    getUserCanVerifyUserImageListOfUser(
        userId: number,
        offset: number,
        limit: number
    ): Promise<{ totalUserCount: number; userList: UserCanVerifyUserImage[] }>;
    deleteUserCanVerifyUserImage(
        userId: number,
        imageOfUserId: number
    ): Promise<void>;
}

export class UserManagementOperatorImpl implements UserManagementOperator {
    constructor(
        private readonly userInfoProvider: UserInfoProvider,
        private readonly userServiceDM: UserServiceClient,
        private readonly imageServiceDM: ImageServiceClient,
        private readonly userCanManageUserImageProtoToUserCanManageUserImageConverter: UserCanManageUserImageProtoToUserCanManageUserImage,
        private readonly userCanVerifyUserImageProtoToUserCanVerifyUserImageConverter: UserCanVerifyUserImageProtoToUserCanVerifyUserImage,
        private readonly filterOptionsToFilterOptionsProto: FilterOptionsToFilterOptionsProtoConverter,
        private readonly logger: Logger
    ) {}

    public async createUser(
        username: string,
        displayName: string,
        password: string
    ): Promise<User> {
        const { error: createUserError, response: createUserResponse } =
            await promisifyGRPCCall(
                this.userServiceDM.createUser.bind(this.userServiceDM),
                { username, displayName }
            );
        if (createUserError !== null) {
            this.logger.error("failed to call user_service.createUser()", {
                error: createUserError,
            });
            throw new ErrorWithHTTPCode(
                "failed to create new user",
                getHttpCodeFromGRPCStatus(createUserError.code)
            );
        }

        const user = User.fromProto(createUserResponse?.user);
        const { error: createUserPasswordError } = await promisifyGRPCCall(
            this.userServiceDM.createUserPassword.bind(this.userServiceDM),
            {
                password: {
                    ofUserId: user.id,
                    password: password,
                },
            }
        );
        if (createUserPasswordError !== null) {
            this.logger.error(
                "failed to call user_service.createUserPassword()",
                {
                    error: createUserError,
                }
            );
            throw new ErrorWithHTTPCode(
                "failed to create new user's password",
                getHttpCodeFromGRPCStatus(createUserPasswordError.code)
            );
        }

        return user;
    }

    public async getUserList(
        offset: number,
        limit: number,
        sortOrder: number,
        withUserRole: boolean,
        withUserTag: boolean,
        filterOptions: UserListFilterOptions
    ): Promise<{
        totalUserCount: number;
        userList: User[];
        userRoleList: UserRole[][] | undefined;
        userTagList: UserTag[][] | undefined;
    }> {
        const filterOptionsProto =
            this.filterOptionsToFilterOptionsProto.convertUserFilterOptions(
                filterOptions
            );
        const sortOrderEnumValue = this.getSortOrderEnumValue(sortOrder);
        const { error: getUserListError, response: getUserListResponse } =
            await promisifyGRPCCall(
                this.userServiceDM.getUserList.bind(this.userServiceDM),
                {
                    limit,
                    offset,
                    sortOrder: sortOrderEnumValue,
                    filterOptions: filterOptionsProto,
                }
            );
        if (getUserListError !== null) {
            this.logger.error("failed to call user_service.getUserList()", {
                error: getUserListError,
            });
            throw new ErrorWithHTTPCode(
                "failed to call user_service.getUserList()",
                getHttpCodeFromGRPCStatus(getUserListError.code)
            );
        }

        const totalUserCount = getUserListResponse?.totalUserCount || 0;
        const userList: User[] =
            getUserListResponse?.userList?.map((userProto) =>
                User.fromProto(userProto)
            ) || [];

        const userIdList = userList.map((user) => user.id);

        const {
            error: getUserRoleListOfUserListError,
            response: getUserRoleListOfUserListResponse,
        } = await promisifyGRPCCall(
            this.userServiceDM.getUserRoleListOfUserList.bind(
                this.userServiceDM
            ),
            { userIdList: userIdList }
        );
        if (getUserRoleListOfUserListError !== null) {
            this.logger.error(
                "failed to call user_service.getUserRoleListOfUserList()",
                {
                    error: getUserRoleListOfUserListError,
                }
            );
            throw new ErrorWithHTTPCode(
                "failed to call user_service.getUserRoleListOfUserList()",
                getHttpCodeFromGRPCStatus(getUserRoleListOfUserListError.code)
            );
        }

        const userRoleList: UserRole[][] = userList.map(() => []);
        getUserRoleListOfUserListResponse?.userRoleListOfUserList?.forEach(
            (userRoleListOfUser, index) => {
                userRoleList[index] =
                    userRoleListOfUser.userRoleList?.map((userRoleProto) =>
                        UserRole.fromProto(userRoleProto)
                    ) || [];
            }
        );

        const {
            error: getUserTagListOfUserListError,
            response: getUserTagListOfUserListResponse,
        } = await promisifyGRPCCall(
            this.userServiceDM.getUserTagListOfUserList.bind(
                this.userServiceDM
            ),
            { userIdList: userIdList }
        );
        if (getUserTagListOfUserListError !== null) {
            this.logger.error(
                "failed to call user_service.getUserTagListOfUserList()",
                {
                    error: getUserTagListOfUserListError,
                }
            );
            throw new ErrorWithHTTPCode(
                "failed to call user_service.getUserTagListOfUserList()",
                getHttpCodeFromGRPCStatus(getUserTagListOfUserListError.code)
            );
        }
        const userTagList: UserTag[][] = userList.map(() => []);
        getUserTagListOfUserListResponse?.userTagListOfUserList?.forEach(
            (userTagListOfUser, index) => {
                userTagList[index] =
                    userTagListOfUser.userTagList?.map((userTagProto) =>
                        UserTag.fromProto(userTagProto)
                    ) || [];
            }
        );

        return { 
            totalUserCount, 
            userList, 
            userRoleList: withUserRole? userRoleList:undefined,
            userTagList: withUserTag? userTagList:undefined 
        };
    }

    private getSortOrderEnumValue(
        sortOrder: number
    ): _UserListSortOrder_Values {
        switch (sortOrder) {
            case 0:
                return _UserListSortOrder_Values.ID_ASCENDING;
            case 1:
                return _UserListSortOrder_Values.ID_DESCENDING;
            case 2:
                return _UserListSortOrder_Values.USERNAME_ASCENDING;
            case 3:
                return _UserListSortOrder_Values.USERNAME_DESCENDING;
            case 4:
                return _UserListSortOrder_Values.DISPLAY_NAME_ASCENDING;
            case 5:
                return _UserListSortOrder_Values.DISPLAY_NAME_DESCENDING;
            default:
                throw new ErrorWithHTTPCode(
                    "invalid sort order",
                    httpStatus.BAD_REQUEST
                );
        }
    }

    public async searchUserList(query: string, limit: number): Promise<User[]> {
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
                "Failed to search user list",
                getHttpCodeFromGRPCStatus(searchUserError.code)
            );
        }

        const userProtoList = searchUserResponse?.userList || [];
        return userProtoList.map((userProto) => User.fromProto(userProto));
    }

    public async updateUser(
        id: number,
        username: string | undefined,
        displayName: string | undefined,
        password: string | undefined
    ): Promise<User> {
        const { error: updateUserError, response: updateUserResponse } =
            await promisifyGRPCCall(
                this.userServiceDM.updateUser.bind(this.userServiceDM),
                {
                    user: { id, username, displayName, password },
                }
            );
        if (updateUserError !== null) {
            this.logger.error("failed to call user_service.updateUser()", {
                error: updateUserError,
            });
            throw new ErrorWithHTTPCode(
                "failed to update user's information",
                getHttpCodeFromGRPCStatus(updateUserError.code)
            );
        }

        const user = User.fromProto(updateUserResponse?.user);
        return user;
    }

    public async addUserCanManageUserImage(
        userId: number,
        imageOfUserId: number,
        canEdit: boolean
    ): Promise<UserCanManageUserImage> {
        const user = await this.userInfoProvider.getUser(userId);
        if (user === null) {
            this.logger.error("user cannot be found", { userId });
            throw new ErrorWithHTTPCode(
                "Failed to add user can manage user image",
                httpStatus.NOT_FOUND
            );
        }
        const imageOfUser = await this.userInfoProvider.getUser(imageOfUserId);
        if (imageOfUser === null) {
            this.logger.error("user cannot be found", { imageOfUserId });
            throw new ErrorWithHTTPCode(
                "Failed to add user can manage user image",
                httpStatus.NOT_FOUND
            );
        }
        const { error: createUserCanManageUserImageError } =
            await promisifyGRPCCall(
                this.imageServiceDM.createUserCanManageUserImage.bind(
                    this.imageServiceDM
                ),
                { userId, imageOfUserId, canEdit }
            );
        if (createUserCanManageUserImageError !== null) {
            this.logger.error(
                "failed to call image_service.createUserCanManageUserImage()",
                { error: createUserCanManageUserImageError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to add user can manage user image",
                getHttpCodeFromGRPCStatus(
                    createUserCanManageUserImageError.code
                )
            );
        }
        return new UserCanManageUserImage(User.fromProto(imageOfUser), canEdit);
    }

    public async getUserCanManageUserImageListOfUser(
        userId: number,
        offset: number,
        limit: number
    ): Promise<{ totalUserCount: number; userList: UserCanManageUserImage[] }> {
        const user = await this.userInfoProvider.getUser(userId);
        if (user === null) {
            this.logger.error("user cannot be found", { userId });
            throw new ErrorWithHTTPCode(
                "Failed to get user can manage user image list",
                httpStatus.NOT_FOUND
            );
        }
        const {
            error: getUserCanManageUserImageOfUserIdError,
            response: getUserCanManageUserImageOfUserIdResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.getUserCanManageUserImageOfUserId.bind(
                this.imageServiceDM
            ),
            { userId, offset, limit }
        );
        if (getUserCanManageUserImageOfUserIdError !== null) {
            this.logger.error(
                "failed to call image_service.getUserCanManageUserImageOfUserId()",
                { error: getUserCanManageUserImageOfUserIdError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to get user can manage user image list",
                getHttpCodeFromGRPCStatus(
                    getUserCanManageUserImageOfUserIdError.code
                )
            );
        }
        const totalUserCount =
            getUserCanManageUserImageOfUserIdResponse?.totalUserCount || 0;
        const userCanManageUserImageProtoList =
            getUserCanManageUserImageOfUserIdResponse?.userList || [];
        const userCanManageUserImageList = await Promise.all(
            userCanManageUserImageProtoList.map((proto) =>
                this.userCanManageUserImageProtoToUserCanManageUserImageConverter.convert(
                    proto
                )
            )
        );
        return { totalUserCount, userList: userCanManageUserImageList };
    }

    public async updateUserCanManageUserImage(
        userId: number,
        imageOfUserId: number,
        canEdit: boolean
    ): Promise<UserCanManageUserImage> {
        const user = await this.userInfoProvider.getUser(userId);
        if (user === null) {
            this.logger.error("user cannot be found", { userId });
            throw new ErrorWithHTTPCode(
                "Failed to update user can manage user image",
                httpStatus.NOT_FOUND
            );
        }
        const imageOfUser = await this.userInfoProvider.getUser(imageOfUserId);
        if (imageOfUser === null) {
            this.logger.error("user cannot be found", { imageOfUserId });
            throw new ErrorWithHTTPCode(
                "Failed to update user can manage user image",
                httpStatus.NOT_FOUND
            );
        }
        const { error: updateUserCanManageUserImageError } =
            await promisifyGRPCCall(
                this.imageServiceDM.updateUserCanManageUserImage.bind(
                    this.imageServiceDM
                ),
                { userId, imageOfUserId, canEdit }
            );
        if (updateUserCanManageUserImageError !== null) {
            this.logger.error(
                "failed to call image_service.updateUserCanManageUserImage()",
                { error: updateUserCanManageUserImageError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to update user can manage user image",
                getHttpCodeFromGRPCStatus(
                    updateUserCanManageUserImageError.code
                )
            );
        }
        return new UserCanManageUserImage(User.fromProto(imageOfUser), canEdit);
    }

    public async deleteUserCanManageUserImage(
        userId: number,
        imageOfUserId: number
    ): Promise<void> {
        const user = await this.userInfoProvider.getUser(userId);
        if (user === null) {
            this.logger.error("user cannot be found", { userId });
            throw new ErrorWithHTTPCode(
                "Failed to delete user can manage user image",
                httpStatus.NOT_FOUND
            );
        }
        const { error: deleteUserCanManageUserImageError } =
            await promisifyGRPCCall(
                this.imageServiceDM.deleteUserCanManageUserImage.bind(
                    this.imageServiceDM
                ),
                { userId, imageOfUserId }
            );
        if (deleteUserCanManageUserImageError !== null) {
            this.logger.error(
                "failed to call image_service.deleteUserCanManageUserImage()",
                { error: deleteUserCanManageUserImageError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to delete user can manage user image",
                getHttpCodeFromGRPCStatus(
                    deleteUserCanManageUserImageError.code
                )
            );
        }
    }

    public async addUserCanVerifyUserImage(
        userId: number,
        imageOfUserId: number
    ): Promise<UserCanVerifyUserImage> {
        const user = await this.userInfoProvider.getUser(userId);
        if (user === null) {
            this.logger.error("user cannot be found", { userId });
            throw new ErrorWithHTTPCode(
                "Failed to add user can verify user image",
                httpStatus.NOT_FOUND
            );
        }
        const imageOfUser = await this.userInfoProvider.getUser(imageOfUserId);
        if (imageOfUser === null) {
            this.logger.error("user cannot be found", { imageOfUserId });
            throw new ErrorWithHTTPCode(
                "Failed to add user can verify user image",
                httpStatus.NOT_FOUND
            );
        }
        const { error: createUserCanVerifyUserImageError } =
            await promisifyGRPCCall(
                this.imageServiceDM.createUserCanVerifyUserImage.bind(
                    this.imageServiceDM
                ),
                { userId, imageOfUserId }
            );
        if (createUserCanVerifyUserImageError !== null) {
            this.logger.error(
                "failed to call image_service.createUserCanVerifyUserImage()",
                { error: createUserCanVerifyUserImageError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to add user can verify user image",
                getHttpCodeFromGRPCStatus(
                    createUserCanVerifyUserImageError.code
                )
            );
        }
        return new UserCanVerifyUserImage(User.fromProto(imageOfUser));
    }

    public async getUserCanVerifyUserImageListOfUser(
        userId: number,
        offset: number,
        limit: number
    ): Promise<{ totalUserCount: number; userList: UserCanVerifyUserImage[] }> {
        const user = await this.userInfoProvider.getUser(userId);
        if (user === null) {
            this.logger.error("user cannot be found", { userId });
            throw new ErrorWithHTTPCode(
                "Failed to get user can verify user image list",
                httpStatus.NOT_FOUND
            );
        }
        const {
            error: getUserCanVerifyUserImageOfUserIdError,
            response: getUserCanVerifyUserImageOfUserIdResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.getUserCanVerifyUserImageOfUserId.bind(
                this.imageServiceDM
            ),
            { userId, offset, limit }
        );
        if (getUserCanVerifyUserImageOfUserIdError !== null) {
            this.logger.error(
                "failed to call image_service.getUserCanVerifyUserImageOfUserId()",
                { error: getUserCanVerifyUserImageOfUserIdError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to get user can verify user image list",
                getHttpCodeFromGRPCStatus(
                    getUserCanVerifyUserImageOfUserIdError.code
                )
            );
        }
        const totalUserCount =
            getUserCanVerifyUserImageOfUserIdResponse?.totalUserCount || 0;
        const userCanVerifyUserImageProtoList =
            getUserCanVerifyUserImageOfUserIdResponse?.userList || [];
        const userCanVerifyUserImageList = await Promise.all(
            userCanVerifyUserImageProtoList.map((proto) =>
                this.userCanVerifyUserImageProtoToUserCanVerifyUserImageConverter.convert(
                    proto
                )
            )
        );
        return { totalUserCount, userList: userCanVerifyUserImageList };
    }

    public async deleteUserCanVerifyUserImage(
        userId: number,
        imageOfUserId: number
    ): Promise<void> {
        const user = await this.userInfoProvider.getUser(userId);
        if (user === null) {
            this.logger.error("user cannot be found", { userId });
            throw new ErrorWithHTTPCode(
                "Failed to delete user can verify user image",
                httpStatus.NOT_FOUND
            );
        }
        const { error: deleteUserCanVerifyUserImageError } =
            await promisifyGRPCCall(
                this.imageServiceDM.deleteUserCanVerifyUserImage.bind(
                    this.imageServiceDM
                ),
                { userId, imageOfUserId }
            );
        if (deleteUserCanVerifyUserImageError !== null) {
            this.logger.error(
                "failed to call image_service.deleteUserCanVerifyUserImage()",
                { error: deleteUserCanVerifyUserImageError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to delete user can verify user image",
                getHttpCodeFromGRPCStatus(
                    deleteUserCanVerifyUserImageError.code
                )
            );
        }
    }
}

injected(
    UserManagementOperatorImpl,
    USER_INFO_PROVIDER_TOKEN,
    USER_SERVICE_DM_TOKEN,
    IMAGE_SERVICE_DM_TOKEN,
    USER_CAN_MANAGE_USER_IMAGE_PROTO_TO_USER_CAN_MANAGE_USER_IMAGE_TOKEN,
    USER_CAN_VERIFY_USER_IMAGE_PROTO_TO_USER_CAN_VERIFY_USER_IMAGE_TOKEN,
    FILTER_OPTIONS_TO_FILTER_OPTIONS_PROTO_CONVERTER,
    LOGGER_TOKEN
);

export const USER_MANAGEMENT_OPERATOR_TOKEN = token<UserManagementOperator>(
    "UserManagementOperator"
);
