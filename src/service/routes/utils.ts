import { Request } from "express";
import { ImageListFilterOptions } from "../../module/schemas";
import { getIdListFromQueryParam } from "../utils";

export function getImageListFilterOptionsFromRequest(
    req: Request
): ImageListFilterOptions {
    const filterOptions = new ImageListFilterOptions();
    filterOptions.image_type_id_list =
        req.query.filter_image_types === undefined
            ? []
            : (req.query.filter_image_types as string[]).map((item) => +item);
    filterOptions.image_tag_id_list = getIdListFromQueryParam(
        req.query.filter_image_tags
    );
    filterOptions.region_label_id_list = getIdListFromQueryParam(
        req.query.filter_region_labels
    );
    filterOptions.uploaded_by_user_id_list = getIdListFromQueryParam(
        req.query.filter_uploaded_by_user_ids
    );
    filterOptions.published_by_user_id_list = getIdListFromQueryParam(
        req.query.filter_published_by_user_ids
    );
    filterOptions.verified_by_user_id_list = getIdListFromQueryParam(
        req.query.filter_verified_by_user_ids
    );
    filterOptions.upload_time_start = +(
        req.query.filter_upload_time_start || 0
    );
    filterOptions.upload_time_end = +(req.query.filter_upload_time_end || 0);
    filterOptions.publish_time_start = +(
        req.query.filter_publish_time_start || 0
    );
    filterOptions.publish_time_end = +(req.query.filter_publish_time_end || 0);
    filterOptions.verify_time_start = +(
        req.query.filter_verify_time_start || 0
    );
    filterOptions.verify_time_end = +(req.query.filter_verify_time_end || 0);
    filterOptions.original_filename_query = `${
        req.query.original_filename_query || ""
    }`;
    filterOptions.image_status_list = getIdListFromQueryParam(
        req.query.filter_image_statuses
    );
    filterOptions.must_match_all_image_tags =
        +(req.query.must_match_all_image_tags || 0) === 1;
    filterOptions.must_match_all_region_labels =
        +(req.query.must_match_all_region_labels || 0) === 1;
    return filterOptions;
}
