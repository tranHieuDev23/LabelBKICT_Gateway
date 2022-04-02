import { Request } from "express";
import { ImageListFilterOptions } from "../../module/images";
import { getIdListFromQueryParam } from "../utils";

export function getImageListFilterOptionsFromRequest(
    req: Request
): ImageListFilterOptions {
    const filterOptions = new ImageListFilterOptions();
    filterOptions.imageTypeIdList =
        req.query.filter_image_types === undefined
            ? []
            : (req.query.filter_image_types as string[]).map((item) => +item);
    filterOptions.imageTagIdList = getIdListFromQueryParam(
        req.query.filter_image_tags
    );
    filterOptions.regionLabelIdList = getIdListFromQueryParam(
        req.query.filter_region_labels
    );
    filterOptions.uploadedByUserIdList = getIdListFromQueryParam(
        req.query.filter_uploaded_by_user_ids
    );
    filterOptions.publishedByUserIdList = getIdListFromQueryParam(
        req.query.filter_published_by_user_ids
    );
    filterOptions.verifiedByUserIdList = getIdListFromQueryParam(
        req.query.filter_verified_by_user_ids
    );
    filterOptions.uploadTimeStart = +(req.query.filter_upload_time_start || 0);
    filterOptions.uploadTimeEnd = +(req.query.filter_upload_time_end || 0);
    filterOptions.publishTimeStart = +(
        req.query.filter_publish_time_start || 0
    );
    filterOptions.publishTimeEnd = +(req.query.filter_publish_time_end || 0);
    filterOptions.verifyTimeStart = +(req.query.filter_verify_time_start || 0);
    filterOptions.verifyTimeEnd = +(req.query.filter_verify_time_end || 0);
    filterOptions.originalFileNameQuery = `${
        req.query.original_file_name_query || ""
    }`;
    filterOptions.imageStatusList = getIdListFromQueryParam(
        req.query.filter_image_statuses
    );
    filterOptions.mustMatchAllImageTags =
        +(req.query.must_match_all_image_tags || 0) === 1;
    filterOptions.mustMatchAllRegionLabels =
        +(req.query.must_match_all_region_labels || 0) === 1;
    return filterOptions;
}
