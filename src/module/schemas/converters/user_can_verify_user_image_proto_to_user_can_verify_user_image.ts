import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { UserCanVerifyUserImage as UserCanVerifyUserImageProto } from "../../../proto/gen/UserCanVerifyUserImage";
import { ErrorWithHTTPCode, LOGGER_TOKEN } from "../../../utils";
import {
    UserInfoProvider,
    USER_INFO_PROVIDER_TOKEN,
} from "../../info_providers";
import { User } from "../user";
import { UserCanVerifyUserImage } from "../user_can_verify_user_image";

export interface UserCanVerifyUserImageProtoToUserCanVerifyUserImage {
    convert(
        proto: UserCanVerifyUserImageProto
    ): Promise<UserCanVerifyUserImage>;
}

export class UserCanVerifyUserImageProtoToUserCanVerifyUserImageImpl
    implements UserCanVerifyUserImageProtoToUserCanVerifyUserImage
{
    constructor(
        private readonly userInfoProvider: UserInfoProvider,
        private readonly logger: Logger
    ) {}

    public async convert(
        proto: UserCanVerifyUserImageProto
    ): Promise<UserCanVerifyUserImage> {
        const userId = proto.imageOfUserId || 0;
        const imageOfUser = await this.userInfoProvider.getUser(userId);
        if (imageOfUser === null) {
            this.logger.error("no user corresponding to user_id", { userId });
            throw new ErrorWithHTTPCode(
                "No user corresponding to user_id",
                httpStatus.INTERNAL_SERVER_ERROR
            );
        }
        return new UserCanVerifyUserImage(User.fromProto(imageOfUser));
    }
}

injected(
    UserCanVerifyUserImageProtoToUserCanVerifyUserImageImpl,
    USER_INFO_PROVIDER_TOKEN,
    LOGGER_TOKEN
);

export const USER_CAN_VERIFY_USER_IMAGE_PROTO_TO_USER_CAN_VERIFY_USER_IMAGE_TOKEN =
    token<UserCanVerifyUserImageProtoToUserCanVerifyUserImage>(
        "UserCanVerifyUserImageProtoToUserCanVerifyUserImage"
    );
