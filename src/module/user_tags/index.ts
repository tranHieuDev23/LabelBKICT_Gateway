import { Container } from "brandi";
import {
    UserTagManagementOperatorImpl,
    USER_TAG_MANAGEMENT_OPERATOR_TOKEN,
} from "./user_tag_management_operator";

export * from "./user_tag_management_operator";

export function bindToContainer(container: Container): void {
    container
        .bind(USER_TAG_MANAGEMENT_OPERATOR_TOKEN)
        .toInstance(UserTagManagementOperatorImpl)
        .inSingletonScope();
}
