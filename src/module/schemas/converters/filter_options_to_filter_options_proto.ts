import { ImageListFilterOptions } from "../image_list_filter_options";
import { ImageListFilterOptions as ImageListFilterOptionsProto } from "../../../proto/gen/ImageListFilterOptions";
import { injected, token } from "brandi";

export interface FilterOptionsToFilterOptionsProtoConverter {
    convert(filterOptions: ImageListFilterOptions): ImageListFilterOptionsProto;
}

export class FilterOptionsToFilterOptionsProtoConverterImpl
    implements FilterOptionsToFilterOptionsProtoConverter
{
    public convert(
        filterOptions: ImageListFilterOptions
    ): ImageListFilterOptionsProto {
        return {
            imageTypeIdList: filterOptions.image_type_id_list,
            imageTagIdList: filterOptions.image_tag_id_list,
            regionLabelIdList: filterOptions.region_label_id_list,
            uploadedByUserIdList: filterOptions.uploaded_by_user_id_list,
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
            mustMatchAllRegionLabels:
                filterOptions.must_match_all_region_labels,
        };
    }
}

injected(FilterOptionsToFilterOptionsProtoConverterImpl);

export const FILTER_OPTIONS_TO_FILTER_OPTIONS_PROTO_CONVERTER =
    token<FilterOptionsToFilterOptionsProtoConverter>(
        "FilterOptionsToFilterOptionsProtoConverter"
    );
