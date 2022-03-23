import { Container } from "brandi";
import {
    ImageProtoToImageConverterImpl,
    IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN,
} from "./image_proto_to_image";
import {
    ImageStatusToImageStatusProtoConverterImpl,
    IMAGE_STATUS_TO_IMAGE_STATUS_PROTO_CONVERTER_TOKEN,
} from "./image_status_to_image_status_proto";
import {
    RegionOperationLogProtoToRegionOperationLogConverterImpl,
    REGION_OPERATION_LOG_PROTO_TO_REGION_OPERATION_LOG_CONVERTER_TOKEN,
} from "./region_operation_log_proto_to_region_operation_log";
import {
    RegionProtoToRegionConverterImpl,
    REGION_PROTO_TO_REGION_CONVERTER_TOKEN,
} from "./region_proto_to_region";
import {
    UserIDToUserConverterImpl,
    USER_ID_TO_USER_CONVERTER_TOKEN,
} from "./user_id_to_user";

export * from "./user_id_to_user";
export * from "./image_proto_to_image";
export * from "./region_proto_to_region";
export * from "./image_status_to_image_status_proto";
export * from "./region_operation_log_proto_to_region_operation_log";

export function bindToContainer(container: Container): void {
    container
        .bind(USER_ID_TO_USER_CONVERTER_TOKEN)
        .toInstance(UserIDToUserConverterImpl)
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
        .bind(
            REGION_OPERATION_LOG_PROTO_TO_REGION_OPERATION_LOG_CONVERTER_TOKEN
        )
        .toInstance(RegionOperationLogProtoToRegionOperationLogConverterImpl)
        .inSingletonScope();
}
