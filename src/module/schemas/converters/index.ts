import { Container } from "brandi";
import {
    ExportProtoToExportConverterImpl,
    EXPORT_PROTO_TO_EXPORT_CONVERTER_TOKEN,
} from "./export_proto_to_export";
import {
    FilterOptionsToFilterOptionsProtoConverterImpl,
    FILTER_OPTIONS_TO_FILTER_OPTIONS_PROTO_CONVERTER,
} from "./filter_options_to_filter_options_proto";
import {
    ImageProtoToImageConverterImpl,
    IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN,
} from "./image_proto_to_image";
import {
    ImageStatusToImageStatusProtoConverterImpl,
    IMAGE_STATUS_TO_IMAGE_STATUS_PROTO_CONVERTER_TOKEN,
} from "./image_status_to_image_status_proto";
import {
    PinnedPageProtoToPinnedPageConverterImpl,
    PINNED_PAGE_PROTO_TO_PINNED_PAGE_CONVERTER_TOKEN,
} from "./pinned_page_proto_to_pinned_page";
import {
    RegionOperationLogProtoToRegionOperationLogConverterImpl,
    REGION_OPERATION_LOG_PROTO_TO_REGION_OPERATION_LOG_CONVERTER_TOKEN,
} from "./region_operation_log_proto_to_region_operation_log";
import {
    RegionProtoToRegionConverterImpl,
    REGION_PROTO_TO_REGION_CONVERTER_TOKEN,
} from "./region_proto_to_region";
import {
    UserCanManageUserImageProtoToUserCanManageUserImageImpl,
    USER_CAN_MANAGE_USER_IMAGE_PROTO_TO_USER_CAN_MANAGE_USER_IMAGE_TOKEN,
} from "./user_can_manage_user_image_proto_to_user_can_manage_user_image";
import {
    UserCanVerifyUserImageProtoToUserCanVerifyUserImageImpl,
    USER_CAN_VERIFY_USER_IMAGE_PROTO_TO_USER_CAN_VERIFY_USER_IMAGE_TOKEN,
} from "./user_can_verify_user_image_proto_to_user_can_verify_user_image";
import {
    UserIdToUserConverterImpl,
    USER_ID_TO_USER_CONVERTER_TOKEN,
} from "./user_id_to_user";

export * from "./user_id_to_user";
export * from "./image_proto_to_image";
export * from "./region_proto_to_region";
export * from "./image_status_to_image_status_proto";
export * from "./filter_options_to_filter_options_proto";
export * from "./region_operation_log_proto_to_region_operation_log";
export * from "./export_proto_to_export";
export * from "./pinned_page_proto_to_pinned_page";
export * from "./user_can_manage_user_image_proto_to_user_can_manage_user_image";
export * from "./user_can_verify_user_image_proto_to_user_can_verify_user_image";

export function bindToContainer(container: Container): void {
    container
        .bind(USER_ID_TO_USER_CONVERTER_TOKEN)
        .toInstance(UserIdToUserConverterImpl)
        .inSingletonScope();
    container
        .bind(IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN)
        .toInstance(ImageProtoToImageConverterImpl)
        .inSingletonScope();
    container
        .bind(REGION_PROTO_TO_REGION_CONVERTER_TOKEN)
        .toInstance(RegionProtoToRegionConverterImpl)
        .inSingletonScope();
    container
        .bind(IMAGE_STATUS_TO_IMAGE_STATUS_PROTO_CONVERTER_TOKEN)
        .toInstance(ImageStatusToImageStatusProtoConverterImpl)
        .inSingletonScope();
    container
        .bind(FILTER_OPTIONS_TO_FILTER_OPTIONS_PROTO_CONVERTER)
        .toInstance(FilterOptionsToFilterOptionsProtoConverterImpl)
        .inSingletonScope();
    container
        .bind(
            REGION_OPERATION_LOG_PROTO_TO_REGION_OPERATION_LOG_CONVERTER_TOKEN
        )
        .toInstance(RegionOperationLogProtoToRegionOperationLogConverterImpl)
        .inSingletonScope();
    container
        .bind(EXPORT_PROTO_TO_EXPORT_CONVERTER_TOKEN)
        .toInstance(ExportProtoToExportConverterImpl)
        .inSingletonScope();
    container
        .bind(PINNED_PAGE_PROTO_TO_PINNED_PAGE_CONVERTER_TOKEN)
        .toInstance(PinnedPageProtoToPinnedPageConverterImpl)
        .inSingletonScope();
    container
        .bind(
            USER_CAN_MANAGE_USER_IMAGE_PROTO_TO_USER_CAN_MANAGE_USER_IMAGE_TOKEN
        )
        .toInstance(UserCanManageUserImageProtoToUserCanManageUserImageImpl)
        .inSingletonScope();
    container
        .bind(
            USER_CAN_VERIFY_USER_IMAGE_PROTO_TO_USER_CAN_VERIFY_USER_IMAGE_TOKEN
        )
        .toInstance(UserCanVerifyUserImageProtoToUserCanVerifyUserImageImpl)
        .inSingletonScope();
}
