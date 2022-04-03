import { Container } from "brandi";
import {
    ExportInfoProviderImpl,
    EXPORT_INFO_PROVIDER_TOKEN,
} from "./export_info_provider";
import {
    ImageInfoProviderImpl,
    IMAGE_INFO_PROVIDER_TOKEN,
} from "./image_info_provider";
import {
    UserInfoProviderImpl,
    USER_INFO_PROVIDER_TOKEN,
} from "./user_info_provider";

export * from "./user_info_provider";
export * from "./image_info_provider";
export * from "./export_info_provider";

export function bindToContainer(container: Container): void {
    container
        .bind(USER_INFO_PROVIDER_TOKEN)
        .toInstance(UserInfoProviderImpl)
        .inSingletonScope();
    container
        .bind(IMAGE_INFO_PROVIDER_TOKEN)
        .toInstance(ImageInfoProviderImpl)
        .inSingletonScope();
    container
        .bind(EXPORT_INFO_PROVIDER_TOKEN)
        .toInstance(ExportInfoProviderImpl)
        .inSingletonScope();
}
