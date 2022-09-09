import { injected, token } from "brandi";
import { Logger } from "winston";
import { USER_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { UserServiceClient } from "../../proto/gen/UserService";
import {
    promisifyGRPCCall,
    ErrorWithHTTPCode,
    getHttpCodeFromGRPCStatus,
    LOGGER_TOKEN,
} from "../../utils";
import { User, UserTag } from "../schemas";

export interface UserTagInfoProvider {
    getUserListOfUserTagDisplayName(userTagName: string): Promise<User[]>;
    getUserTagListOfUser(userId: number): Promise<UserTag[]>;
}

export class UserTagInfoProviderImpl implements UserTagInfoProvider {
    constructor(
        private readonly userServiceDM: UserServiceClient,
        private readonly logger: Logger
    ) {}

    public async getUserListOfUserTagDisplayName(
        userTagName: string
    ): Promise<User[]> {
        const { error: getUserTagError, response: getUserTagResponse } =
            await promisifyGRPCCall(
                this.userServiceDM.GetUserTagList.bind(this.userServiceDM),
                {}
            );
        if (getUserTagError !== null) {
            this.logger.error("failed to call user_service.getUserTagList()", {
                error: getUserTagError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to get user list with manageable images",
                getHttpCodeFromGRPCStatus(getUserTagError.code)
            );
        }
        const userTagList: UserTag[] =
            getUserTagResponse?.userTagList?.map((userTagProto) =>
                UserTag.fromProto(userTagProto)
            ) || [];
        const userDisabledTagIndex: number = userTagList.findIndex(
            (userTag) => userTag.display_name == userTagName
        );
        let userTagIdList: number[] = [];
        if (userDisabledTagIndex !== -1) {
            userTagIdList.push(userTagList[userDisabledTagIndex].id);
        }

        const {
            error: getDisabledUserListError,
            response: getDisabledUserListResponse,
        } = await promisifyGRPCCall(
            this.userServiceDM.GetUserListOfUserTagList.bind(
                this.userServiceDM
            ),
            { userTagIdList: userTagIdList }
        );
        if (getDisabledUserListError !== null) {
            this.logger.error(
                "failed to call user_service.getUserListOfUserTagList()",
                {
                    error: getDisabledUserListError,
                }
            );
            throw new ErrorWithHTTPCode(
                "Failed to get user list with manageable images",
                getHttpCodeFromGRPCStatus(getDisabledUserListError.code)
            );
        }
        const userList: User[] =
            getDisabledUserListResponse?.userList?.map((userProto) =>
                User.fromProto(userProto)
            ) || [];
        return userList;
    }

    public async getUserTagListOfUser(
        userId: number
    ): Promise<UserTag[]> {
        const {
            error: getUserTagListOfUserError,
            response: getUserTagListOfUserResponse,
        } = await promisifyGRPCCall(
            this.userServiceDM.getUserTagListOfUser.bind(
                this.userServiceDM
            ),
            { userId: userId }
        );
        if (getUserTagListOfUserError !== null) {
            this.logger.error(
                "failed to call user_service.getUserTagListOfUser()",
                { error: getUserTagListOfUserError }
            );
            throw new ErrorWithHTTPCode(
                "failed to log in with password",
                getHttpCodeFromGRPCStatus(getUserTagListOfUserError.code)
            );
        }

        return (
            getUserTagListOfUserResponse?.userTagList?.map(
                (userTagProto) =>
                    UserTag.fromProto(userTagProto)
            ) || []
        );
    }
}

injected(UserTagInfoProviderImpl, USER_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const USER_TAG_INFO_PROVIDER_TOKEN = 
    token<UserTagInfoProvider>("UserTagInfoProvider");