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
                {
                    username,
                    displayName,
                }
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

        // At this point, the newly created user with all information should be available.
        const userID = createUserResponse?.user?.id || 0;
        const userUsername = createUserResponse?.user?.username || "";
        const userDisplayName = createUserResponse?.user?.displayName || "";
        const { error: createUserPasswordError } = await promisifyGRPCCall(
            this.userServiceDM.createUserPassword.bind(this.userServiceDM),
            {
                password: {
                    ofUserId: userID,
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

        return new User(userID, userUsername, userDisplayName);
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
                {
                    limit,
                    offset,
                    sortOrder: sortOrderEnumValue,
                }
            );
        if (getUserListError !== null) {
            throw new ErrorWithHTTPCode(
                "failed to call user_service.getUserList()",
                getHttpCodeFromGRPCStatus(getUserListError.code)
            );
        }

        // At this point, the user list with all information should be available
        const totalUserCount = getUserListResponse?.totalUserCount || 0;
        const userList: User[] =
            getUserListResponse?.userList?.map(
                (item) =>
                    new User(
                        item.id || 0,
                        item.username || "",
                        item.displayName || ""
                    )
            ) || [];

        if (!withUserRole) {
            return { totalUserCount, userList, userRoleList: undefined };
        }

        const userIDList = userList.map((user) => user.id);
        const {
            error: getUserRoleListOfUserListError,
            response: getUserRoleListOfUserListResponse,
        } = await promisifyGRPCCall(
            this.userServiceDM.getUserRoleListOfUserList.bind(
                this.userServiceDM
            ),
            { userIdList: userIDList }
        );
        if (getUserRoleListOfUserListError !== null) {
            throw new ErrorWithHTTPCode(
                "failed to call user_service.getUserRoleListOfUserList()",
                getHttpCodeFromGRPCStatus(getUserRoleListOfUserListError.code)
            );
        }

        const userRoleList: UserRole[][] = userList.map(() => []);
        getUserRoleListOfUserListResponse?.userRoleListOfUserList?.forEach(
            (userRoleListOfUser, index) => {
                userRoleList[index] =
                    userRoleListOfUser.userRoleList?.map(
                        (userRole) =>
                            new UserRole(
                                userRole.id || 0,
                                userRole.displayName || "",
                                userRole.description || ""
                            )
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
                    user: {
                        id,
                        username,
                        displayName,
                        password,
                    },
                }
            );
        if (updateUserError !== null) {
            this.logger.error("failed to call user_service.updateUser()", {
                error: updateUserError,
            });
            throw new ErrorWithHTTPCode(
                "failed to create new user",
                getHttpCodeFromGRPCStatus(updateUserError.code)
            );
        }

        // At this point, the newly updated user with all information should be available.
        const userID = updateUserResponse?.user?.id || 0;
        const userUsername = updateUserResponse?.user?.username || "";
        const userDisplayName = updateUserResponse?.user?.displayName || "";
        return new User(userID, userUsername, userDisplayName);
    }
}

injected(UserManagementOperatorImpl, USER_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const USER_MANAGEMENT_OPERATOR_TOKEN = token<UserManagementOperator>(
    "UserManagementOperator"
);
