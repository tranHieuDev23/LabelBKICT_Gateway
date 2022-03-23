import { injected, token } from "brandi";
import {
    UserInfoProvider,
    USER_INFO_PROVIDER_TOKEN,
} from "../../info_providers";
import { User } from "../user";

export interface UserIDToUserConverter {
    convert(userID: number | undefined): Promise<User | null>;
}

export class UserIDToUserConverterImpl implements UserIDToUserConverter {
    constructor(private readonly userInfoProvider: UserInfoProvider) {}

    public async convert(userID: number | undefined): Promise<User | null> {
        if (userID === undefined || userID === 0) {
            return null;
        }
        const userProto = await this.userInfoProvider.getUser(userID);
        return User.fromProto(userProto);
    }
}

injected(UserIDToUserConverterImpl, USER_INFO_PROVIDER_TOKEN);

export const USER_ID_TO_USER_CONVERTER_TOKEN = token<UserIDToUserConverter>(
    "UserIDToUserConverter"
);
