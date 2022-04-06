import { ImageStatus } from "./image";

export class ImageListFilterOptions {
    public image_type_id_list: number[] = [];
    public image_tag_id_list: number[] = [];
    public region_label_id_list: number[] = [];
    public uploaded_by_user_id_list: number[] = [];
    public published_by_user_id_list: number[] = [];
    public verified_by_user_id_list: number[] = [];
    public upload_time_start = 0;
    public upload_time_end = 0;
    public publish_time_start = 0;
    public publish_time_end = 0;
    public verify_time_start = 0;
    public verify_time_end = 0;
    public original_filename_query = "";
    public image_status_list: ImageStatus[] = [];
    public must_match_all_image_tags = false;
    public must_match_all_region_labels = false;
    public must_be_bookmarked = false;
}
