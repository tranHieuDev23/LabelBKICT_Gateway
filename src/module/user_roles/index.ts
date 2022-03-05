import { Container } from "brandi";
import {
    UserRoleManagementOperatorImpl,
    USER_ROLE_MANAGEMENT_OPERATOR_TOKEN,
} from "./user_role_management_operator";

export * from "./user_role_management_operator";

export function bindToContainer(container: Container): void {
    container
        .bind(USER_ROLE_MANAGEMENT_OPERATOR_TOKEN)
        .toInstance(UserRoleManagementOperatorImpl)
        .inSingletonScope();
}
