import { injected, token } from "brandi";
import { Logger } from "winston";
import { IMAGE_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { UserCanVerifyUserImage } from "../../proto/gen/UserCanVerifyUserImage";
import { ErrorWithHTTPCode, getHttpCodeFromGRPCStatus, LOGGER_TOKEN, promisifyGRPCCall } from "../../utils";

export interface UserCanVerifyUserImageInfoProvider {
    getUserCanVerifyUserImageListOfUserId(userId: number): Promise<UserCanVerifyUserImage[]>;
    getVerifiableUserImageUserIdListOfUserId(userId: number): Promise<number[]>;
}

const GET_USER_CAN_VERIFY_USER_IMAGE_OF_USER_ID_LIMIT = 10000;

export class UserCanVerifyUserImageInfoProviderImpl implements UserCanVerifyUserImageInfoProvider {
    constructor(private readonly imageServiceDM: ImageServiceClient, private readonly logger: Logger) {}

    public async getUserCanVerifyUserImageListOfUserId(userId: number): Promise<UserCanVerifyUserImage[]> {
        const { error: getUserCanVerifyUserImageOfUserIdError, response: getUserCanVerifyUserImageOfUserIdResponse } =
            await promisifyGRPCCall(this.imageServiceDM.getUserCanVerifyUserImageOfUserId.bind(this.imageServiceDM), {
                userId: userId,
                offset: 0,
                limit: GET_USER_CAN_VERIFY_USER_IMAGE_OF_USER_ID_LIMIT,
            });
        if (getUserCanVerifyUserImageOfUserIdError !== null) {
            this.logger.error("failed to call image_service.getUserCanVerifyUserImageOfUserId()", {
                error: getUserCanVerifyUserImageOfUserIdError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to get user list with verifiable images",
                getHttpCodeFromGRPCStatus(getUserCanVerifyUserImageOfUserIdError.code)
            );
        }

        return getUserCanVerifyUserImageOfUserIdResponse?.userList || [];
    }

    public async getVerifiableUserImageUserIdListOfUserId(userId: number): Promise<number[]> {
        const userCanVerifyUserImageList = await this.getUserCanVerifyUserImageListOfUserId(userId);
        if (userCanVerifyUserImageList.length === 0) {
            return [];
        }
        const userIdList = [
            ...userCanVerifyUserImageList.map((userCanVerifyUserImage) => userCanVerifyUserImage.imageOfUserId || 0),
            userId,
        ];
        return userIdList;
    }
}

injected(UserCanVerifyUserImageInfoProviderImpl, IMAGE_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const USER_CAN_VERIFY_USER_IMAGE_INFO_PROVIDER_TOKEN = token<UserCanVerifyUserImageInfoProvider>(
    "UserCanVerifyUserImageInfoProvider"
);
