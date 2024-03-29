import { ParsedQs } from "qs";
import { ImageListFilterOptions, UserListFilterOptions } from "../../module/schemas";
import { getIdListFromQueryParam, getStringListFromQueryParam } from "../utils";

export function getImageListFilterOptionsFromQueryParams(queryParams: ParsedQs): ImageListFilterOptions {
    const filterOptions = new ImageListFilterOptions();
    filterOptions.image_id_list = getIdListFromQueryParam(queryParams.filter_image_ids);
    filterOptions.image_type_id_list = getIdListFromQueryParam(queryParams.filter_image_types);
    filterOptions.image_tag_id_list = getIdListFromQueryParam(queryParams.filter_image_tags);
    filterOptions.region_label_id_list = getIdListFromQueryParam(queryParams.filter_region_labels);
    filterOptions.uploaded_by_user_id_list = getIdListFromQueryParam(queryParams.filter_uploaded_by_user_ids);
    filterOptions.published_by_user_id_list = getIdListFromQueryParam(queryParams.filter_published_by_user_ids);
    filterOptions.verified_by_user_id_list = getIdListFromQueryParam(queryParams.filter_verified_by_user_ids);
    filterOptions.upload_time_start = +(queryParams.filter_upload_time_start || 0);
    filterOptions.upload_time_end = +(queryParams.filter_upload_time_end || 0);
    filterOptions.publish_time_start = +(queryParams.filter_publish_time_start || 0);
    filterOptions.publish_time_end = +(queryParams.filter_publish_time_end || 0);
    filterOptions.verify_time_start = +(queryParams.filter_verify_time_start || 0);
    filterOptions.verify_time_end = +(queryParams.filter_verify_time_end || 0);
    filterOptions.original_filename_query = `${queryParams.original_filename_query || ""}`;
    filterOptions.image_status_list = getIdListFromQueryParam(queryParams.filter_image_statuses);
    filterOptions.must_match_all_image_tags = +(queryParams.must_match_all_image_tags || 0) === 1;
    filterOptions.must_match_all_region_labels = +(queryParams.must_match_all_region_labels || 0) === 1;
    filterOptions.must_be_bookmarked = +(queryParams.must_be_bookmarked || 0) === 1;
    filterOptions.must_have_description = +(queryParams.must_have_description || 0) === 1;
    filterOptions.original_filename_list = getStringListFromQueryParam(queryParams.filter_original_filename_list);
    return filterOptions;
}

export function getImageListFilterOptionsFromBody(filter_options: any): ImageListFilterOptions {
    const filterOptions = new ImageListFilterOptions();
    filterOptions.image_id_list = filter_options.image_id_list || [];
    filterOptions.image_type_id_list = filter_options.image_type_id_list || [];
    filterOptions.image_tag_id_list = filter_options.image_tag_id_list || [];
    filterOptions.region_label_id_list = filter_options.region_label_id_list || [];
    filterOptions.uploaded_by_user_id_list = filter_options.uploaded_by_user_id_list || [];
    filterOptions.published_by_user_id_list = filter_options.published_by_user_id_list || [];
    filterOptions.verified_by_user_id_list = filter_options.verified_by_user_id_list || [];
    filterOptions.upload_time_start = filter_options.upload_time_start || 0;
    filterOptions.upload_time_end = filter_options.upload_time_end || 0;
    filterOptions.publish_time_start = filter_options.publish_time_start || 0;
    filterOptions.publish_time_end = filter_options.publish_time_end || 0;
    filterOptions.verify_time_start = filter_options.verify_time_start || 0;
    filterOptions.verify_time_end = filter_options.verify_time_end || 0;
    filterOptions.original_filename_query = filter_options.original_filename_query || "";
    filterOptions.image_status_list = filter_options.image_status_list || [];
    filterOptions.must_match_all_image_tags = filter_options.must_match_all_region_labels || false;
    filterOptions.must_match_all_region_labels = filter_options.must_match_all_region_labels || false;
    filterOptions.must_be_bookmarked = filter_options.must_be_bookmarked || false;
    filterOptions.must_have_description = filter_options.must_have_description || false;
    filterOptions.original_filename_list = filter_options.original_filename_list || [];
    return filterOptions;
}

export function getUserListFilterOptionsFromQueryParams(queryParams: ParsedQs): UserListFilterOptions {
    const filterOptions = new UserListFilterOptions();
    filterOptions.user_role_id_list =
        queryParams.filter_user_roles === undefined
            ? []
            : (queryParams.filter_user_roles as string[]).map((item) => +item);
    filterOptions.user_tag_id_list =
        queryParams.filter_user_tags === undefined
            ? []
            : (queryParams.filter_user_tags as string[]).map((item) => +item);
    filterOptions.username_query = `${queryParams.username_query || ""}`;
    return filterOptions;
}
