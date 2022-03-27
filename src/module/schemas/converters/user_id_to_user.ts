import { injected, token } from "brandi";
import {
    UserInfoProvider,
    USER_INFO_PROVIDER_TOKEN,
} from "../../info_providers";
import { User } from "../user";

export interface UserIdToUserConverter {
    convert(userId: number | undefined): Promise<User | null>;
}

export class UserIdToUserConverterImpl implements UserIdToUserConverter {
    constructor(private readonly userInfoProvider: UserInfoProvider) {}

    public async convert(userId: number | undefined): Promise<User | null> {
        if (userId === undefined || userId === 0) {
            return null;
        }
        const userProto = await this.userInfoProvider.getUser(userId);
        return User.fromProto(userProto);
    }
}

injected(UserIdToUserConverterImpl, USER_INFO_PROVIDER_TOKEN);

export const USER_ID_TO_USER_CONVERTER_TOKEN = token<UserIdToUserConverter>(
    "UserIdToUserConverter"
);
