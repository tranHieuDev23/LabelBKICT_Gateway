import { Container } from "brandi";
import {
    UserManagementOperatorImpl,
    USER_MANAGEMENT_OPERATOR_TOKEN,
} from "./user_management_operator";

export * from "./user_management_operator";

export function bindToContainer(container: Container): void {
    container
        .bind(USER_MANAGEMENT_OPERATOR_TOKEN)
        .toInstance(UserManagementOperatorImpl)
        .inSingletonScope();
}
