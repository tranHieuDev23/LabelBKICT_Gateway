import { injected, token } from "brandi";
import { Logger } from "winston";
import { IMAGE_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { UserCanManageUserImage } from "../../proto/gen/UserCanManageUserImage";
import { ErrorWithHTTPCode, getHttpCodeFromGRPCStatus, LOGGER_TOKEN, promisifyGRPCCall } from "../../utils";

export interface UserCanManageUserImageInfoProvider {
    getUserCanManageUserImageListOfUserId(userId: number): Promise<UserCanManageUserImage[]>;
    getManageableUserImageUserIdListOfUserId(userId: number): Promise<number[]>;
}

const GET_USER_CAN_MANAGE_USER_IMAGE_OF_USER_ID_LIMIT = 10000;

export class UserCanManageUserImageInfoProviderImpl implements UserCanManageUserImageInfoProvider {
    constructor(private readonly imageServiceDM: ImageServiceClient, private readonly logger: Logger) {}

    public async getUserCanManageUserImageListOfUserId(userId: number): Promise<UserCanManageUserImage[]> {
        const { error: getUserCanManageUserImageOfUserIdError, response: getUserCanManageUserImageOfUserIdResponse } =
            await promisifyGRPCCall(this.imageServiceDM.getUserCanManageUserImageOfUserId.bind(this.imageServiceDM), {
                userId: userId,
                offset: 0,
                limit: GET_USER_CAN_MANAGE_USER_IMAGE_OF_USER_ID_LIMIT,
            });
        if (getUserCanManageUserImageOfUserIdError !== null) {
            this.logger.error("failed to call image_service.getUserCanManageUserImageOfUserId()", {
                error: getUserCanManageUserImageOfUserIdError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to get user list with manageable images",
                getHttpCodeFromGRPCStatus(getUserCanManageUserImageOfUserIdError.code)
            );
        }

        return getUserCanManageUserImageOfUserIdResponse?.userList || [];
    }

    public async getManageableUserImageUserIdListOfUserId(userId: number): Promise<number[]> {
        const userCanManageUserImageList = await this.getUserCanManageUserImageListOfUserId(userId);
        if (userCanManageUserImageList.length === 0) {
            return [];
        }
        const userIdList = [
            ...userCanManageUserImageList.map((userCanManageUserImage) => userCanManageUserImage.imageOfUserId || 0),
            userId,
        ];
        return userIdList;
    }
}

injected(UserCanManageUserImageInfoProviderImpl, IMAGE_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const USER_CAN_MANAGE_USER_IMAGE_INFO_PROVIDER_TOKEN = token<UserCanManageUserImageInfoProvider>(
    "UserCanManageUserImageInfoProvider"
);
