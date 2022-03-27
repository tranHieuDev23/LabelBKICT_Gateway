import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { USER_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { _UserListSortOrder_Values } from "../../proto/gen/UserListSortOrder";
import { UserServiceClient } from "../../proto/gen/UserService";
import {
    ErrorWithHTTPCode,
    getHttpCodeFromGRPCStatus,
    LOGGER_TOKEN,
} from "../../utils";
import { promisifyGRPCCall } from "../../utils/grpc";
import { User, UserRole } from "../schemas";

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
        withUserRole: boolean
    ): Promise<{
        totalUserCount: number;
        userList: User[];
        userRoleList: UserRole[][] | undefined;
    }>;
    searchUserList(query: string, limit: number): Promise<User[]>;
    updateUser(
        id: number,
        username: string | undefined,
        displayName: string | undefined,
        password: string | undefined
    ): Promise<User>;
}

export class UserManagementOperatorImpl implements UserManagementOperator {
    constructor(
        private readonly userServiceDM: UserServiceClient,
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
        withUserRole: boolean
    ): Promise<{
        totalUserCount: number;
        userList: User[];
        userRoleList: UserRole[][] | undefined;
    }> {
        const sortOrderEnumValue = this.getSortOrderEnumValue(sortOrder);
        const { error: getUserListError, response: getUserListResponse } =
            await promisifyGRPCCall(
                this.userServiceDM.getUserList.bind(this.userServiceDM),
                { limit, offset, sortOrder: sortOrderEnumValue }
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
        if (!withUserRole) {
            return { totalUserCount, userList, userRoleList: undefined };
        }

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
        return { totalUserCount, userList, userRoleList };
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
}

injected(UserManagementOperatorImpl, USER_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const USER_MANAGEMENT_OPERATOR_TOKEN = token<UserManagementOperator>(
    "UserManagementOperator"
);
