import { Container } from "brandi";
import {
    PINNED_PAGE_MANAGEMENT_OPERATOR_TOKEN,
    PinnedPageManagementOperatorImpl,
} from "./pinned_page_management_operator";

export * from "./pinned_page_management_operator";

export function bindToContainer(container: Container): void {
    container
        .bind(PINNED_PAGE_MANAGEMENT_OPERATOR_TOKEN)
        .toInstance(PinnedPageManagementOperatorImpl)
        .inSingletonScope();
}
