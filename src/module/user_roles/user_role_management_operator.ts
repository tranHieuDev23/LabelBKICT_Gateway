import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { USER_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { _UserRoleListSortOrder_Values } from "../../proto/gen/UserRoleListSortOrder";
import { UserServiceClient } from "../../proto/gen/UserService";
import {
    ErrorWithHTTPCode,
    getHttpCodeFromGRPCStatus,
    LOGGER_TOKEN,
    promisifyGRPCCall,
} from "../../utils";
import { UserPermission, UserRole } from "../schemas";

export interface UserRoleManagementOperator {
    createUserRole(displayName: string, description: string): Promise<UserRole>;
    getUserRoleList(
        offset: number,
        limit: number,
        sortOrder: number,
        withUserPermission: boolean
    ): Promise<{
        totalUserRoleCount: number;
        userRoleList: UserRole[];
        userPermissionList: UserPermission[][] | undefined;
    }>;
    updateUserRole(
        id: number,
        displayName: string | undefined,
        description: string | undefined
    ): Promise<UserRole>;
    deleteUserRole(id: number): Promise<void>;
    addUserRoleToUser(userID: number, userRoleID: number): Promise<void>;
    removeUserRoleFromUser(userID: number, userRoleID: number): Promise<void>;
}

export class UserRoleManagementOperatorImpl
    implements UserRoleManagementOperator
{
    constructor(
        private readonly userServiceDM: UserServiceClient,
        private readonly logger: Logger
    ) {}

    public async createUserRole(
        displayName: string,
        description: string
    ): Promise<UserRole> {
        const { error: createUserRoleError, response: createUserRoleResponse } =
            await promisifyGRPCCall(
                this.userServiceDM.createUserRole.bind(this.userServiceDM),
                { displayName, description }
            );
        if (createUserRoleError !== null) {
            this.logger.error("failed to call user_service.createUserRole()", {
                error: createUserRoleError,
            });
            throw new ErrorWithHTTPCode(
                "failed to create new user role",
                getHttpCodeFromGRPCStatus(createUserRoleError.code)
            );
        }

        return UserRole.fromProto(createUserRoleResponse?.userRole);
    }

    public async getUserRoleList(
        offset: number,
        limit: number,
        sortOrder: number,
        withUserPermission: boolean
    ): Promise<{
        totalUserRoleCount: number;
        userRoleList: UserRole[];
        userPermissionList: UserPermission[][] | undefined;
    }> {
        const sortOrderEnumValue = this.getSortOrderEnumValue(sortOrder);
        const {
            error: getUserRoleListError,
            response: getUserRoleListResponse,
        } = await promisifyGRPCCall(
            this.userServiceDM.getUserRoleList.bind(this.userServiceDM),
            { limit, offset, sortOrder: sortOrderEnumValue }
        );
        if (getUserRoleListError !== null) {
            this.logger.error("failed to call user_service.getUserRoleList()", {
                error: getUserRoleListError,
            });
            throw new ErrorWithHTTPCode(
                "failed to call user_service.getUserRoleList()",
                getHttpCodeFromGRPCStatus(getUserRoleListError.code)
            );
        }

        const totalUserRoleCount =
            getUserRoleListResponse?.totalUserRoleCount || 0;
        const userRoleList: UserRole[] =
            getUserRoleListResponse?.userRoleList?.map((userRoleProto) =>
                UserRole.fromProto(userRoleProto)
            ) || [];
        if (!withUserPermission) {
            return {
                totalUserRoleCount,
                userRoleList,
                userPermissionList: undefined,
            };
        }

        const userRoleIDList = userRoleList.map((userRole) => userRole.id);
        const {
            error: getUserPermissionListOfUserRoleListError,
            response: getUserPermissionListOfUserRoleListResponse,
        } = await promisifyGRPCCall(
            this.userServiceDM.getUserPermissionListOfUserRoleList.bind(
                this.userServiceDM
            ),
            { userRoleIdList: userRoleIDList }
        );
        if (getUserPermissionListOfUserRoleListError !== null) {
            this.logger.error(
                "failed to call user_service.getUserPermissionListOfUserRoleList()",
                { error: getUserPermissionListOfUserRoleListError }
            );
            throw new ErrorWithHTTPCode(
                "failed to call user_service.getUserPermissionListOfUserRoleList()",
                getHttpCodeFromGRPCStatus(
                    getUserPermissionListOfUserRoleListError.code
                )
            );
        }

        const userPermissionList: UserPermission[][] = userRoleList.map(
            () => []
        );
        getUserPermissionListOfUserRoleListResponse?.userPermissionListOfUserRoleList?.forEach(
            (userPermissionListOfUserRole, index) => {
                userPermissionList[index] =
                    userPermissionListOfUserRole.userPermissionList?.map(
                        (userPermissionProto) =>
                            UserPermission.fromProto(userPermissionProto)
                    ) || [];
            }
        );
        return { totalUserRoleCount, userRoleList, userPermissionList };
    }

    private getSortOrderEnumValue(
        sortOrder: number
    ): _UserRoleListSortOrder_Values {
        switch (sortOrder) {
            case 0:
                return _UserRoleListSortOrder_Values.ID_ASCENDING;
            case 1:
                return _UserRoleListSortOrder_Values.ID_DESCENDING;
            case 2:
                return _UserRoleListSortOrder_Values.DISPLAY_NAME_ASCENDING;
            case 3:
                return _UserRoleListSortOrder_Values.DISPLAY_NAME_DESCENDING;
            default:
                throw new ErrorWithHTTPCode(
                    "invalid sort order",
                    httpStatus.BAD_REQUEST
                );
        }
    }

    public async updateUserRole(
        id: number,
        displayName: string | undefined,
        description: string | undefined
    ): Promise<UserRole> {
        const { error: updateUserRoleError, response: updateUserRoleResponse } =
            await promisifyGRPCCall(
                this.userServiceDM.updateUserRole.bind(this.userServiceDM),
                {
                    userRole: { id, displayName, description },
                }
            );
        if (updateUserRoleError !== null) {
            this.logger.error("failed to call user_service.updateUserRole()", {
                error: updateUserRoleError,
            });
            throw new ErrorWithHTTPCode(
                "failed to update user role",
                getHttpCodeFromGRPCStatus(updateUserRoleError.code)
            );
        }

        return UserRole.fromProto(updateUserRoleResponse?.userRole);
    }

    public async deleteUserRole(id: number): Promise<void> {
        const { error: deleteUserRoleError } = await promisifyGRPCCall(
            this.userServiceDM.deleteUserRole.bind(this.userServiceDM),
            { id }
        );
        if (deleteUserRoleError !== null) {
            this.logger.error("failed to call user_service.deleteUserRole()", {
                error: deleteUserRoleError,
            });
            throw new ErrorWithHTTPCode(
                "failed to delete user role",
                getHttpCodeFromGRPCStatus(deleteUserRoleError.code)
            );
        }
    }

    public async addUserRoleToUser(
        userID: number,
        userRoleID: number
    ): Promise<void> {
        const { error: addUserRoleToUserError } = await promisifyGRPCCall(
            this.userServiceDM.addUserRoleToUser.bind(this.userServiceDM),
            { userId: userID, userRoleId: userRoleID }
        );
        if (addUserRoleToUserError !== null) {
            this.logger.error(
                "failed to call user_service.addUserRoleToUser()",
                { error: addUserRoleToUserError }
            );
            throw new ErrorWithHTTPCode(
                "failed to add user role to user",
                getHttpCodeFromGRPCStatus(addUserRoleToUserError.code)
            );
        }
    }

    public async removeUserRoleFromUser(
        userID: number,
        userRoleID: number
    ): Promise<void> {
        const { error: removeUserRoleFromUserError } = await promisifyGRPCCall(
            this.userServiceDM.removeUserRoleFromUser.bind(this.userServiceDM),
            { userId: userID, userRoleId: userRoleID }
        );
        if (removeUserRoleFromUserError !== null) {
            this.logger.error(
                "failed to call user_service.removeUserRoleFromUser()",
                { error: removeUserRoleFromUserError }
            );
            throw new ErrorWithHTTPCode(
                "failed to remove user role from user",
                getHttpCodeFromGRPCStatus(removeUserRoleFromUserError.code)
            );
        }
    }
}

injected(UserRoleManagementOperatorImpl, USER_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const USER_ROLE_MANAGEMENT_OPERATOR_TOKEN =
    token<UserRoleManagementOperator>("UserRoleManagementOperator");
