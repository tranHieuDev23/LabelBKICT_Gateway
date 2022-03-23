import { injected, token } from "brandi";
import { Logger } from "winston";
import { USER_SERVICE_DM_TOKEN } from "../../../dataaccess/grpc";
import { UserServiceClient } from "../../../proto/gen/UserService";
import {
    promisifyGRPCCall,
    ErrorWithHTTPCode,
    getHttpCodeFromGRPCStatus,
    LOGGER_TOKEN,
} from "../../../utils";
import { User } from "../user";

export interface UserIDToUserConverter {
    convert(userID: number | undefined): Promise<User | null>;
}

export class UserIDToUserConverterImpl implements UserIDToUserConverter {
    constructor(
        private readonly userServiceDM: UserServiceClient,
        private readonly logger: Logger
    ) {}

    public async convert(userID: number | undefined): Promise<User | null> {
        if (userID === undefined || userID === 0) {
            return null;
        }

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
                "failed to get user from user_id",
                getHttpCodeFromGRPCStatus(getUserError.code)
            );
        }

        return User.fromProto(getUserResponse?.user);
    }
}

injected(UserIDToUserConverterImpl, USER_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const USER_ID_TO_USER_CONVERTER_TOKEN = token<UserIDToUserConverter>(
    "UserIDToUserConverter"
);
