import { Container } from "brandi";
import {
    RegionManagementOperatorImpl,
    REGION_MANAGEMENT_OPERATOR_TOKEN,
} from "./region_management_operator";

export * from "./region_management_operator";

export function bindToContainer(container: Container): void {
    container
        .bind(REGION_MANAGEMENT_OPERATOR_TOKEN)
        .toInstance(RegionManagementOperatorImpl)
        .inSingletonScope();
}
