import { AuthenticatedUserInformation } from "../../service/utils";
import {
    FilterOptionsToFilterOptionsProtoConverter,
    FILTER_OPTIONS_TO_FILTER_OPTIONS_PROTO_CONVERTER,
    ImageListFilterOptions,
} from "../schemas";
import { ImageListFilterOptions as ImageListFilterOptionsProto } from "../../proto/gen/ImageListFilterOptions";
import { UserTagInfoProvider, USER_TAG_INFO_PROVIDER_TOKEN } from "../info_providers";
import { injected, token } from "brandi";

export interface UserManageableImageFilterOptionsProvider {
    getUserManageableImageFilterOptionsProto(
        authenticatedUserInfo: AuthenticatedUserInformation,
        filterOptions: ImageListFilterOptions
    ): Promise<ImageListFilterOptionsProto>;
}

const USER_TAG_DISPLAY_NAME_DISABLED = "Disabled";

export class UserManageableImageFilterOptionsProviderImpl implements UserManageableImageFilterOptionsProvider {
    constructor(
        private readonly userTagInfoProvider: UserTagInfoProvider,
        private readonly filterOptionsToFilterOptionsProto: FilterOptionsToFilterOptionsProtoConverter
    ) {}

    public async getUserManageableImageFilterOptionsProto(
        authenticatedUserInfo: AuthenticatedUserInformation,
        filterOptions: ImageListFilterOptions
    ): Promise<ImageListFilterOptionsProto> {
        const disabledUserList = await this.userTagInfoProvider.getUserListOfUserTagByDisplayName(
            USER_TAG_DISPLAY_NAME_DISABLED
        );
        const disabledUserIdList = disabledUserList.map((user) => user.id);

        const filterOptionsProto = this.filterOptionsToFilterOptionsProto.convertImageFilterOptions(
            authenticatedUserInfo,
            filterOptions
        );
        filterOptionsProto.notUploadedByUserIdList = Array.from(
            new Set([...(filterOptionsProto.notUploadedByUserIdList || []), ...disabledUserIdList])
        );

        return filterOptionsProto;
    }
}

injected(
    UserManageableImageFilterOptionsProviderImpl,
    USER_TAG_INFO_PROVIDER_TOKEN,
    FILTER_OPTIONS_TO_FILTER_OPTIONS_PROTO_CONVERTER
);

export const USER_MANAGEABLE_IMAGE_FILTER_OPTIONS_PROVIDER = token<UserManageableImageFilterOptionsProvider>(
    "UserManageableImageFilterOptionsProvider"
);
