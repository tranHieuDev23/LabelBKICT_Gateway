import { AuthenticatedUserInformation } from "../../service/utils";
import {
    FilterOptionsToFilterOptionsProtoConverter,
    FILTER_OPTIONS_TO_FILTER_OPTIONS_PROTO_CONVERTER,
    ImageListFilterOptions,
} from "../schemas";
import { ImageListFilterOptions as ImageListFilterOptionsProto } from "../../proto/gen/ImageListFilterOptions";
import {
    UserCanManageUserImageInfoProvider,
    UserTagInfoProvider,
    USER_CAN_MANAGE_USER_IMAGE_INFO_PROVIDER_TOKEN,
    USER_TAG_INFO_PROVIDER_TOKEN,
} from "../info_providers";
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
        private readonly userCanManageUserImageInfoProvider: UserCanManageUserImageInfoProvider,
        private readonly userTagInfoProvider: UserTagInfoProvider,
        private readonly filterOptionsToFilterOptionsProto: FilterOptionsToFilterOptionsProtoConverter
    ) {}

    public async getUserManageableImageFilterOptionsProto(
        authenticatedUserInfo: AuthenticatedUserInformation,
        filterOptions: ImageListFilterOptions
    ): Promise<ImageListFilterOptionsProto> {
        const userId = authenticatedUserInfo.user.id;
        const manageableImageUserIdList =
            await this.userCanManageUserImageInfoProvider.getManageableUserImageUserIdListOfUserId(userId);

        const disabledUserList = await this.userTagInfoProvider.getUserListOfUserTagByDisplayName(
            USER_TAG_DISPLAY_NAME_DISABLED
        );
        const disabledUserIdList = disabledUserList.map((user) => user.id);

        const filterOptionsProto = this.filterOptionsToFilterOptionsProto.convertImageFilterOptions(
            authenticatedUserInfo,
            filterOptions
        );

        if (
            filterOptionsProto.uploadedByUserIdList === undefined ||
            filterOptionsProto.uploadedByUserIdList.length === 0
        ) {
            filterOptionsProto.uploadedByUserIdList = manageableImageUserIdList;
        } else if (manageableImageUserIdList.length > 0) {
            const manageableImageUserIdSet = new Set(manageableImageUserIdList);
            filterOptionsProto.uploadedByUserIdList = filterOptionsProto.uploadedByUserIdList?.filter((userId) =>
                manageableImageUserIdSet.has(userId)
            );
        }

        filterOptionsProto.notUploadedByUserIdList = Array.from(
            new Set([...(filterOptionsProto.notUploadedByUserIdList || []), ...disabledUserIdList])
        );

        return filterOptionsProto;
    }
}

injected(
    UserManageableImageFilterOptionsProviderImpl,
    USER_CAN_MANAGE_USER_IMAGE_INFO_PROVIDER_TOKEN,
    USER_TAG_INFO_PROVIDER_TOKEN,
    FILTER_OPTIONS_TO_FILTER_OPTIONS_PROTO_CONVERTER
);

export const USER_MANAGEABLE_IMAGE_FILTER_OPTIONS_PROVIDER = token<UserManageableImageFilterOptionsProvider>(
    "UserManageableImageFilterOptionsProvider"
);
