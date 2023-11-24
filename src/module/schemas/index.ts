import { Container } from "brandi";
import * as converters from "./converters";

export * from "./user";
export * from "./user_role";
export * from "./user_permission";
export * from "./user_tag";
export * from "./user_list_filter_options";
export * from "./image_type";
export * from "./region_label";
export * from "./image_tag_group";
export * from "./image_tag";
export * from "./image";
export * from "./image_list_filter_options";
export * from "./image_bookmark";
export * from "./polygon";
export * from "./region";
export * from "./region_operator_log";
export * from "./export";
export * from "./pinned_page";
export * from "./converters";
export * from "./user_can_manage_user_image";
export * from "./user_can_verify_user_image";
export * from "./point_of_interest";

export function bindToContainer(container: Container): void {
    converters.bindToContainer(container);
}
