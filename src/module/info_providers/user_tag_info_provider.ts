import { injected, token } from "brandi";
import { Logger } from "winston";
import { USER_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { UserServiceClient } from "../../proto/gen/UserService";
import { promisifyGRPCCall, ErrorWithHTTPCode, getHttpCodeFromGRPCStatus, LOGGER_TOKEN } from "../../utils";
import { User, UserTag } from "../schemas";

export interface UserTagInfoProvider {
    getUserListOfUserTagByDisplayName(displayName: string): Promise<User[]>;
    getUserTagListOfUser(userId: number): Promise<UserTag[]>;
}

export class UserTagInfoProviderImpl implements UserTagInfoProvider {
    constructor(private readonly userServiceDM: UserServiceClient, private readonly logger: Logger) {}

    public async getUserListOfUserTagByDisplayName(displayName: string): Promise<User[]> {
        const { error: getUserListOfUserTagByDisplayNameError, response: getUserListOfUserTagByDisplayNameResponse } =
            await promisifyGRPCCall(this.userServiceDM.getUserListOfUserTagByDisplayName.bind(this.userServiceDM), {
                displayName: displayName,
            });
        if (getUserListOfUserTagByDisplayNameError !== null) {
            this.logger.error("failed to call user_service.getUserListOfUserTagByDisplayName()", {
                error: getUserListOfUserTagByDisplayNameError,
            });
            throw new ErrorWithHTTPCode(
                "failed to get user list of user tag by display name",
                getHttpCodeFromGRPCStatus(getUserListOfUserTagByDisplayNameError.code)
            );
        }

        return (getUserListOfUserTagByDisplayNameResponse?.userList || []).map((userProto) =>
            User.fromProto(userProto)
        );
    }

    public async getUserTagListOfUser(userId: number): Promise<UserTag[]> {
        const { error: getUserTagListOfUserError, response: getUserTagListOfUserResponse } = await promisifyGRPCCall(
            this.userServiceDM.getUserTagListOfUser.bind(this.userServiceDM),
            { userId: userId }
        );
        if (getUserTagListOfUserError !== null) {
            this.logger.error("failed to call user_service.getUserTagListOfUser()", {
                error: getUserTagListOfUserError,
            });
            throw new ErrorWithHTTPCode(
                "failed to get user tag list of user",
                getHttpCodeFromGRPCStatus(getUserTagListOfUserError.code)
            );
        }

        return (getUserTagListOfUserResponse?.userTagList || []).map((userTagProto) => UserTag.fromProto(userTagProto));
    }
}

injected(UserTagInfoProviderImpl, USER_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const USER_TAG_INFO_PROVIDER_TOKEN = token<UserTagInfoProvider>("UserTagInfoProvider");
