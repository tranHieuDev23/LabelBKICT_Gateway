import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { USER_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { UserServiceClient } from "../../proto/gen/UserService";
import { ErrorWithHTTPCode, getHttpCodeFromGRPCStatus, LOGGER_TOKEN, promisifyGRPCCall } from "../../utils";
import { UserTagInfoProvider, USER_TAG_INFO_PROVIDER_TOKEN } from "../info_providers";
import { User, UserPermission, UserRole, UserTag } from "../schemas";

const USER_TAG_DISPLAY_NAME_DISABLED = "Disabled";

export interface SessionManagementOperator {
    loginWithPassword(
        username: string,
        password: string
    ): Promise<{
        user: User;
        userRoleList: UserRole[];
        userPermissionList: UserPermission[];
        token: string;
    }>;
    logout(token: string): Promise<void>;
    getUserOfSession(token: string): Promise<{
        user: User;
        userRoleList: UserRole[];
        userPermissionList: UserPermission[];
        userTagList: UserTag[];
        newToken: string | null;
    }>;
}

export class SessionManagementOperatorImpl implements SessionManagementOperator {
    constructor(
        private readonly userServiceDM: UserServiceClient,
        private readonly userTagInfoProvider: UserTagInfoProvider,
        private readonly logger: Logger
    ) {}

    public async loginWithPassword(
        username: string,
        password: string
    ): Promise<{
        user: User;
        userRoleList: UserRole[];
        userPermissionList: UserPermission[];
        token: string;
    }> {
        const { error: loginWithPasswordError, response: loginWithPasswordResponse } = await promisifyGRPCCall(
            this.userServiceDM.loginWithPassword.bind(this.userServiceDM),
            { username, password }
        );
        if (loginWithPasswordError !== null) {
            this.logger.error("failed to call user_service.loginWithPassword()", { error: loginWithPasswordError });
            throw new ErrorWithHTTPCode(
                "failed to log in with password",
                getHttpCodeFromGRPCStatus(loginWithPasswordError.code)
            );
        }

        const user = User.fromProto(loginWithPasswordResponse?.user);
        const token = loginWithPasswordResponse?.token || "";

        const userTagList = await this.userTagInfoProvider.getUserTagListOfUser(user.id);
        for (const userTag of userTagList) {
            if (userTag.display_name === USER_TAG_DISPLAY_NAME_DISABLED) {
                this.logger.error("user is disabled", { username });
                throw new ErrorWithHTTPCode(`User ${username} is disabled`, httpStatus.UNAUTHORIZED);
            }
        }

        const userRoleList = await this.getUserRoleListOfUser(user.id);
        const userPermissionList = await this.getUserPermissionListOfUser(user.id);

        return { user, userRoleList, userPermissionList, token };
    }

    public async logout(token: string): Promise<void> {
        const { error: blacklistTokenError } = await promisifyGRPCCall(
            this.userServiceDM.blacklistToken.bind(this.userServiceDM),
            { token }
        );
        if (blacklistTokenError !== null) {
            this.logger.error("failed to call user_service.blacklistToken()", {
                error: blacklistTokenError,
            });
            throw new ErrorWithHTTPCode("failed to log out", getHttpCodeFromGRPCStatus(blacklistTokenError.code));
        }
    }

    public async getUserOfSession(token: string): Promise<{
        user: User;
        userRoleList: UserRole[];
        userPermissionList: UserPermission[];
        userTagList: UserTag[];
        newToken: string | null;
    }> {
        const { error: getUserFromTokenError, response: getUserFromTokenResponse } = await promisifyGRPCCall(
            this.userServiceDM.getUserFromToken.bind(this.userServiceDM),
            { token }
        );
        if (getUserFromTokenError !== null) {
            this.logger.error("failed to call user_service.getUserFromToken()", { error: getUserFromTokenError });
            throw new ErrorWithHTTPCode(
                "failed to get user of session",
                getHttpCodeFromGRPCStatus(getUserFromTokenError.code)
            );
        }

        const user = User.fromProto(getUserFromTokenResponse?.user);
        const newToken = getUserFromTokenResponse?.newToken || null;
        const userRoleList = await this.getUserRoleListOfUser(user.id);
        const userPermissionList = await this.getUserPermissionListOfUser(user.id);
        const userTagList = await this.userTagInfoProvider.getUserTagListOfUser(user.id);

        return { user, userRoleList, userPermissionList, userTagList, newToken };
    }

    private async getUserRoleListOfUser(userId: number): Promise<UserRole[]> {
        const { error: getUserRoleListOfUserListError, response: getUserRoleListOfUserListResponse } =
            await promisifyGRPCCall(this.userServiceDM.getUserRoleListOfUserList.bind(this.userServiceDM), {
                userIdList: [userId],
            });
        if (getUserRoleListOfUserListError !== null) {
            this.logger.error("failed to call user_service.getUserRoleListOfUserList()", {
                error: getUserRoleListOfUserListError,
            });
            throw new ErrorWithHTTPCode(
                "failed to log in with password",
                getHttpCodeFromGRPCStatus(getUserRoleListOfUserListError.code)
            );
        }

        if (getUserRoleListOfUserListResponse?.userRoleListOfUserList === undefined) {
            return [];
        }

        return (
            getUserRoleListOfUserListResponse.userRoleListOfUserList[0].userRoleList?.map((userRoleProto) =>
                UserRole.fromProto(userRoleProto)
            ) || []
        );
    }

    private async getUserPermissionListOfUser(userId: number): Promise<UserPermission[]> {
        const { error: getUserPermissionListOfUserError, response: getUserPermissionListOfUserResponse } =
            await promisifyGRPCCall(this.userServiceDM.getUserPermissionListOfUser.bind(this.userServiceDM), {
                userId: userId,
            });
        if (getUserPermissionListOfUserError !== null) {
            this.logger.error("failed to call user_service.getUserPermissionListOfUser()", {
                error: getUserPermissionListOfUserError,
            });
            throw new ErrorWithHTTPCode(
                "failed to log in with password",
                getHttpCodeFromGRPCStatus(getUserPermissionListOfUserError.code)
            );
        }

        return (
            getUserPermissionListOfUserResponse?.userPermissionList?.map((userPermissionProto) =>
                UserPermission.fromProto(userPermissionProto)
            ) || []
        );
    }
}

injected(SessionManagementOperatorImpl, USER_SERVICE_DM_TOKEN, USER_TAG_INFO_PROVIDER_TOKEN, LOGGER_TOKEN);

export const SESSION_MANAGEMENT_OPERATOR_TOKEN = token<SessionManagementOperator>("SessionManagementOperator");
