import { Container } from "brandi";
import * as converters from "./converters";

export * from "./user";
export * from "./user_role";
export * from "./user_permission";
export * from "./image_type";
export * from "./region_label";
export * from "./image_tag_group";
export * from "./image_tag";
export * from "./image";
export * from "./polygon";
export * from "./region";
export * from "./region_operator_log";
export * from "./converters";

export function bindToContainer(container: Container): void {
    converters.bindToContainer(container);
}
