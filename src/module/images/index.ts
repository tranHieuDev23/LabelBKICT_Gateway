import { Container } from "brandi";
import {
    ImageListManagementOperatorImpl,
    IMAGE_LIST_MANAGEMENT_OPERATOR_TOKEN,
} from "./image_list_management_operator";
import {
    ImageManagementOperatorImpl,
    IMAGE_MANAGEMENT_OPERATOR_TOKEN,
} from "./image_management_operator";

export * from "./image_management_operator";
export * from "./image_list_management_operator";

export function bindToContainer(container: Container): void {
    container
        .bind(IMAGE_MANAGEMENT_OPERATOR_TOKEN)
        .toInstance(ImageManagementOperatorImpl)
        .inSingletonScope();
    container
        .bind(IMAGE_LIST_MANAGEMENT_OPERATOR_TOKEN)
        .toInstance(ImageListManagementOperatorImpl)
        .inSingletonScope();
}
