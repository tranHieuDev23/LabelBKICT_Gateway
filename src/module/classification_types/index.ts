import { Container } from "brandi";
import {
    ClassificationTypeManagementOperatorImpl,
    CLASSIFICATION_TYPE_MANAGEMENT_OPERATOR_TOKEN
} from "./classification_type_management_operator";

export * from "./classification_type_management_operator";

export function bindToContainer(container: Container): void {
    container
        .bind(CLASSIFICATION_TYPE_MANAGEMENT_OPERATOR_TOKEN)
        .toInstance(ClassificationTypeManagementOperatorImpl)
        .inSingletonScope();
}