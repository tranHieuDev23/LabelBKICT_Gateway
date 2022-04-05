import { Container } from "brandi";
import { EXPORT_SERVICE_DM_TOKEN, getExportServiceDM } from "./export_service";
import { getImageServiceDM, IMAGE_SERVICE_DM_TOKEN } from "./image_service";
import { getModelServiceDM, MODEL_SERVICE_DM_TOKEN } from "./model_service";
import { getUserServiceDM, USER_SERVICE_DM_TOKEN } from "./user_service";

export * from "./user_service";
export * from "./image_service";
export * from "./export_service";
export * from "./model_service";

export function bindToContainer(container: Container): void {
    container
        .bind(USER_SERVICE_DM_TOKEN)
        .toInstance(getUserServiceDM)
        .inSingletonScope();
    container
        .bind(IMAGE_SERVICE_DM_TOKEN)
        .toInstance(getImageServiceDM)
        .inSingletonScope();
    container
        .bind(EXPORT_SERVICE_DM_TOKEN)
        .toInstance(getExportServiceDM)
        .inSingletonScope();
    container
        .bind(MODEL_SERVICE_DM_TOKEN)
        .toInstance(getModelServiceDM)
        .inSingletonScope();
}
