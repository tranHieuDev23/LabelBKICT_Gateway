import { Container } from "brandi";
import {
    SessionManagementOperatorImpl,
    SESSION_MANAGEMENT_OPERATOR_TOKEN,
} from "./session_management_operator";

export * from "./session_management_operator";

export function bindToContainer(container: Container): void {
    container
        .bind(SESSION_MANAGEMENT_OPERATOR_TOKEN)
        .toInstance(SessionManagementOperatorImpl)
        .inSingletonScope();
}
