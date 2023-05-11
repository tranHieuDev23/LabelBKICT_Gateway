import { AuthenticatedUserInformation } from "../../service/utils";
import {
    FilterOptionsToFilterOptionsProtoConverter,
    FILTER_OPTIONS_TO_FILTER_OPTIONS_PROTO_CONVERTER,
    ImageListFilterOptions,
} from "../schemas";
import { ImageListFilterOptions as ImageListFilterOptionsProto } from "../../proto/gen/ImageListFilterOptions";
import { _ImageStatus_Values } from "../../proto/gen/ImageStatus";
import {
    UserCanVerifyUserImageInfoProvider,
    UserTagInfoProvider,
    USER_CAN_VERIFY_USER_IMAGE_INFO_PROVIDER_TOKEN,
    USER_TAG_INFO_PROVIDER_TOKEN,
} from "../info_providers";
import { injected, token } from "brandi";

export interface UserVerifiableImageFilterOptionsProvider {
    getUserVerifiableImageFilterOptionsProto(
        authenticatedUserInfo: AuthenticatedUserInformation,
        filterOptions: ImageListFilterOptions
    ): Promise<ImageListFilterOptionsProto>;
}

const USER_TAG_DISPLAY_NAME_DISABLED = "Disabled";

export class UserVerifiableImageFilterOptionsProviderImpl implements UserVerifiableImageFilterOptionsProvider {
    constructor(
        private readonly userCanVerifyUserImageInfoProvider: UserCanVerifyUserImageInfoProvider,
        private readonly userTagInfoProvider: UserTagInfoProvider,
        private readonly filterOptionsToFilterOptionsProto: FilterOptionsToFilterOptionsProtoConverter
    ) {}

    public async getUserVerifiableImageFilterOptionsProto(
        authenticatedUserInfo: AuthenticatedUserInformation,
        filterOptions: ImageListFilterOptions
    ): Promise<ImageListFilterOptionsProto> {
        const userId = authenticatedUserInfo.user.id;
        const verifiableImageUserIdList =
            await this.userCanVerifyUserImageInfoProvider.getVerifiableUserImageUserIdListOfUserId(userId);

        const disabledUserList = await this.userTagInfoProvider.getUserListOfUserTagByDisplayName(
            USER_TAG_DISPLAY_NAME_DISABLED
        );
        const disabledUserIdList = disabledUserList.map((user) => user.id);

        const filterOptionsProto = this.filterOptionsToFilterOptionsProto.convertImageFilterOptions(
            authenticatedUserInfo,
            filterOptions
        );

        if (filterOptionsProto.imageStatusList === undefined || filterOptionsProto.imageStatusList.length === 0) {
            filterOptionsProto.imageStatusList = [_ImageStatus_Values.PUBLISHED, _ImageStatus_Values.VERIFIED];
        } else {
            filterOptionsProto.imageStatusList = filterOptionsProto.imageStatusList.filter(
                (status) => status === _ImageStatus_Values.PUBLISHED || status === _ImageStatus_Values.VERIFIED
            );
        }

        if (
            filterOptionsProto.uploadedByUserIdList === undefined ||
            filterOptionsProto.uploadedByUserIdList.length === 0
        ) {
            filterOptionsProto.uploadedByUserIdList = verifiableImageUserIdList;
        } else if (verifiableImageUserIdList.length > 0) {
            const verifiableImageUserIdSet = new Set(verifiableImageUserIdList);
            filterOptionsProto.uploadedByUserIdList = filterOptionsProto.uploadedByUserIdList.filter((userId) =>
                verifiableImageUserIdSet.has(userId)
            );
        }

        filterOptionsProto.notUploadedByUserIdList = Array.from(
            new Set([...(filterOptionsProto.notUploadedByUserIdList || []), ...disabledUserIdList])
        );

        return filterOptionsProto;
    }
}

injected(
    UserVerifiableImageFilterOptionsProviderImpl,
    USER_CAN_VERIFY_USER_IMAGE_INFO_PROVIDER_TOKEN,
    USER_TAG_INFO_PROVIDER_TOKEN,
    FILTER_OPTIONS_TO_FILTER_OPTIONS_PROTO_CONVERTER
);

export const USER_VERIFIABLE_IMAGE_FILTER_OPTIONS_PROVIDER = token<UserVerifiableImageFilterOptionsProvider>(
    "UserVerifiableImageFilterOptionsProvider"
);
