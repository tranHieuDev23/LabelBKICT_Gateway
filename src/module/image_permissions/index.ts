import { Container } from "brandi";
import {
    MANAGE_SELF_AND_ALL_CHECKER_TOKEN,
    getManageSelfAndAllChecker,
    MANAGE_SELF_AND_ALL_CAN_EDIT_CHECKER_TOKEN,
    getManageSelfAndAllCanEditChecker,
    MANAGE_SELF_AND_ALL_AND_VERIFY_CHECKER_TOKEN,
    getManageSelfAndAllAndVerifyChecker,
    MANAGE_SELF_AND_ALL_CAN_EDIT_AND_VERIFY_CHECKER_TOKEN,
    getManageSelfAndAllCanEditAndVerifyChecker,
    VERIFY_CHECKER_TOKEN,
    getVerifyChecker,
} from "./combined_checker";

export * from "./image_permission_checker";
export * from "./combined_checker";

export function bindToContainer(container: Container): void {
    container.bind(MANAGE_SELF_AND_ALL_CHECKER_TOKEN).toInstance(getManageSelfAndAllChecker).inSingletonScope();
    container
        .bind(MANAGE_SELF_AND_ALL_CAN_EDIT_CHECKER_TOKEN)
        .toInstance(getManageSelfAndAllCanEditChecker)
        .inSingletonScope();
    container.bind(VERIFY_CHECKER_TOKEN).toInstance(getVerifyChecker).inSingletonScope();
    container
        .bind(MANAGE_SELF_AND_ALL_AND_VERIFY_CHECKER_TOKEN)
        .toInstance(getManageSelfAndAllAndVerifyChecker)
        .inSingletonScope();
    container
        .bind(MANAGE_SELF_AND_ALL_CAN_EDIT_AND_VERIFY_CHECKER_TOKEN)
        .toInstance(getManageSelfAndAllCanEditAndVerifyChecker)
        .inSingletonScope();
}
