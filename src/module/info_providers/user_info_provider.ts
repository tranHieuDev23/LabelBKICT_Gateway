import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { USER_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { User } from "../../proto/gen/User";
import { UserServiceClient } from "../../proto/gen/UserService";
import {
    promisifyGRPCCall,
    ErrorWithHTTPCode,
    getHttpCodeFromGRPCStatus,
    LOGGER_TOKEN,
} from "../../utils";

export interface UserInfoProvider {
    getUser(userID: number): Promise<User>;
}

export class UserInfoProviderImpl implements UserInfoProvider {
    constructor(
        private readonly userServiceDM: UserServiceClient,
        private readonly logger: Logger
    ) {}

    public async getUser(userID: number): Promise<User> {
        const { error: getUserError, response: getUserResponse } =
            await promisifyGRPCCall(
                this.userServiceDM.getUser.bind(this.userServiceDM),
                { id: userID }
            );
        if (getUserError !== null) {
            this.logger.error("failed to call user_service.getUser()", {
                error: getUserError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to get user",
                getHttpCodeFromGRPCStatus(getUserError.code)
            );
        }

        if (getUserResponse?.user === undefined) {
            this.logger.error("invalid user_service.getUser() response", {
                userID,
            });

            throw new ErrorWithHTTPCode(
                "Failed to get user",
                getHttpCodeFromGRPCStatus(httpStatus.INTERNAL_SERVER_ERROR)
            );
        }

        return getUserResponse?.user;
    }
}

injected(UserInfoProviderImpl, USER_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const USER_INFO_PROVIDER_TOKEN =
    token<UserInfoProvider>("UserInfoProvider");
