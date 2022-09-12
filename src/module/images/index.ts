import { Container } from "brandi";
import {
    ImageListManagementOperatorImpl,
    IMAGE_LIST_MANAGEMENT_OPERATOR_TOKEN,
} from "./image_list_management_operator";
import { ImageManagementOperatorImpl, IMAGE_MANAGEMENT_OPERATOR_TOKEN } from "./image_management_operator";
import {
    UserManageableImageFilterOptionsProviderImpl,
    USER_MANAGEABLE_IMAGE_FILTER_OPTIONS_PROVIDER,
} from "./user_manageable_image_filter_options_provider";
import {
    UserVerifiableImageFilterOptionsProviderImpl,
    USER_VERIFIABLE_IMAGE_FILTER_OPTIONS_PROVIDER,
} from "./user_verifiable_image_filter_options_provider";

export * from "./image_management_operator";
export * from "./image_list_management_operator";
export * from "./user_manageable_image_filter_options_provider";
export * from "./user_verifiable_image_filter_options_provider";

export function bindToContainer(container: Container): void {
    container.bind(IMAGE_MANAGEMENT_OPERATOR_TOKEN).toInstance(ImageManagementOperatorImpl).inSingletonScope();
    container.bind(IMAGE_LIST_MANAGEMENT_OPERATOR_TOKEN).toInstance(ImageListManagementOperatorImpl).inSingletonScope();
    container
        .bind(USER_MANAGEABLE_IMAGE_FILTER_OPTIONS_PROVIDER)
        .toInstance(UserManageableImageFilterOptionsProviderImpl)
        .inSingletonScope();
    container
        .bind(USER_VERIFIABLE_IMAGE_FILTER_OPTIONS_PROVIDER)
        .toInstance(UserVerifiableImageFilterOptionsProviderImpl)
        .inSingletonScope();
}
