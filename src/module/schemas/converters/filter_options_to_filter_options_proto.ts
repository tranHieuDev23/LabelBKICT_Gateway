import { ImageListFilterOptions } from "../image_list_filter_options";
import { ImageListFilterOptions as ImageListFilterOptionsProto } from "../../../proto/gen/ImageListFilterOptions";
import { UserListFilterOptions as UserListFilterOptionsProto } from "../../../proto/gen/UserListFilterOptions";
import { injected, token } from "brandi";
import { AuthenticatedUserInformation } from "../../../service/utils";
import { UserListFilterOptions } from "../user_list_filter_options";

export interface FilterOptionsToFilterOptionsProtoConverter {
    convertImageFilterOptions(
        authUserInfo: AuthenticatedUserInformation,
        filterOptions: ImageListFilterOptions
    ): ImageListFilterOptionsProto;
    convertUserFilterOptions(filterOptions: UserListFilterOptions): UserListFilterOptionsProto;
}

export class FilterOptionsToFilterOptionsProtoConverterImpl implements FilterOptionsToFilterOptionsProtoConverter {
    public convertImageFilterOptions(
        authUserInfo: AuthenticatedUserInformation,
        filterOptions: ImageListFilterOptions
    ): ImageListFilterOptionsProto {
        return {
            imageIdList: filterOptions.image_id_list,
            imageTypeIdList: filterOptions.image_type_id_list,
            imageTagIdList: filterOptions.image_tag_id_list,
            regionLabelIdList: filterOptions.region_label_id_list,
            uploadedByUserIdList: filterOptions.uploaded_by_user_id_list,
            notUploadedByUserIdList: filterOptions.not_uploaded_by_user_id_list,
            publishedByUserIdList: filterOptions.published_by_user_id_list,
            verifiedByUserIdList: filterOptions.verified_by_user_id_list,
            uploadTimeStart: filterOptions.upload_time_start,
            uploadTimeEnd: filterOptions.upload_time_end,
            publishTimeStart: filterOptions.publish_time_start,
            publishTimeEnd: filterOptions.publish_time_end,
            verifyTimeStart: filterOptions.verify_time_start,
            verifyTimeEnd: filterOptions.verify_time_end,
            originalFileNameQuery: filterOptions.original_filename_query,
            imageStatusList: filterOptions.image_status_list,
            mustMatchAllImageTags: filterOptions.must_match_all_image_tags,
            mustMatchAllRegionLabels: filterOptions.must_match_all_region_labels,
            bookmarkedByUserIdList: filterOptions.must_be_bookmarked ? [authUserInfo.user.id] : [],
            mustHaveDescription: filterOptions.must_have_description,
            originalFileNameList: filterOptions.original_filename_list,
        };
    }

    public convertUserFilterOptions(filterOptions: UserListFilterOptions): UserListFilterOptionsProto {
        return {
            usernameQuery: filterOptions.username_query,
            userTagIdList: filterOptions.user_tag_id_list,
            userRoleIdList: filterOptions.user_role_id_list,
        };
    }
}

injected(FilterOptionsToFilterOptionsProtoConverterImpl);

export const FILTER_OPTIONS_TO_FILTER_OPTIONS_PROTO_CONVERTER = token<FilterOptionsToFilterOptionsProtoConverter>(
    "FilterOptionsToFilterOptionsProtoConverter"
);
