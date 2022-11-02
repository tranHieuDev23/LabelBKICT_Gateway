import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { UserCanManageUserImage as UserCanManageUserImageProto } from "../../../proto/gen/UserCanManageUserImage";
import { ErrorWithHTTPCode, LOGGER_TOKEN } from "../../../utils";
import {
    UserInfoProvider,
    USER_INFO_PROVIDER_TOKEN,
} from "../../info_providers";
import { User } from "../user";
import { UserCanManageUserImage } from "../user_can_manage_user_image";

export interface UserCanManageUserImageProtoToUserCanManageUserImage {
    convert(
        proto: UserCanManageUserImageProto
    ): Promise<UserCanManageUserImage>;
}

export class UserCanManageUserImageProtoToUserCanManageUserImageImpl
    implements UserCanManageUserImageProtoToUserCanManageUserImage
{
    constructor(
        private readonly userInfoProvider: UserInfoProvider,
        private readonly logger: Logger
    ) {}

    public async convert(
        proto: UserCanManageUserImageProto
    ): Promise<UserCanManageUserImage> {
        const userId = proto.imageOfUserId || 0;
        const imageOfUser = await this.userInfoProvider.getUser(userId);
        if (imageOfUser === null) {
            this.logger.error("no user corresponding to user_id", { userId });
            throw new ErrorWithHTTPCode(
                "No user corresponding to user_id",
                httpStatus.INTERNAL_SERVER_ERROR
            );
        }
        return new UserCanManageUserImage(
            User.fromProto(imageOfUser),
            proto.canEdit || false
        );
    }
}

injected(
    UserCanManageUserImageProtoToUserCanManageUserImageImpl,
    USER_INFO_PROVIDER_TOKEN,
    LOGGER_TOKEN
);

export const USER_CAN_MANAGE_USER_IMAGE_PROTO_TO_USER_CAN_MANAGE_USER_IMAGE_TOKEN =
    token<UserCanManageUserImageProtoToUserCanManageUserImage>(
        "UserCanManageUserImageProtoToUserCanManageUserImage"
    );
