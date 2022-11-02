import { injected, token } from "brandi";
import {
    UserCanManageUserImageInfoProvider,
    UserCanVerifyUserImageInfoProvider,
    USER_CAN_MANAGE_USER_IMAGE_INFO_PROVIDER_TOKEN,
    USER_CAN_VERIFY_USER_IMAGE_INFO_PROVIDER_TOKEN,
} from "../info_providers";
import { ImagesManageAllChecker } from "./images_manage_all";
import { ImagesManageSelfChecker } from "./images_manage_self";
import { ImagesVerifyChecker } from "./images_verify";
import { ImagePermissionChecker } from "./image_permission_checker";

export function getManageSelfAndAllCanEditChecker(
    userCanManageUserImageInfoProvider: UserCanManageUserImageInfoProvider
): ImagePermissionChecker {
    return new ImagesManageAllChecker(
        new ImagesManageSelfChecker(null),
        userCanManageUserImageInfoProvider,
        true
    );
}

export function getManageSelfAndAllAndVerifyChecker(
    userCanManageUserImageInfoProvider: UserCanManageUserImageInfoProvider,
    userCanVerifyUserImageInfoProvider: UserCanVerifyUserImageInfoProvider
): ImagePermissionChecker {
    return new ImagesVerifyChecker(
        new ImagesManageAllChecker(
            new ImagesManageSelfChecker(null),
            userCanManageUserImageInfoProvider,
            false
        ),
        userCanVerifyUserImageInfoProvider
    );
}

export function getManageSelfAndAllCanEditAndVerifyChecker(
    userCanManageUserImageInfoProvider: UserCanManageUserImageInfoProvider,
    userCanVerifyUserImageInfoProvider: UserCanVerifyUserImageInfoProvider
): ImagePermissionChecker {
    return new ImagesVerifyChecker(
        new ImagesManageAllChecker(
            new ImagesManageSelfChecker(null),
            userCanManageUserImageInfoProvider,
            true
        ),
        userCanVerifyUserImageInfoProvider
    );
}

injected(
    getManageSelfAndAllCanEditChecker,
    USER_CAN_MANAGE_USER_IMAGE_INFO_PROVIDER_TOKEN
);
injected(
    getManageSelfAndAllAndVerifyChecker,
    USER_CAN_MANAGE_USER_IMAGE_INFO_PROVIDER_TOKEN,
    USER_CAN_VERIFY_USER_IMAGE_INFO_PROVIDER_TOKEN
);
injected(
    getManageSelfAndAllCanEditAndVerifyChecker,
    USER_CAN_MANAGE_USER_IMAGE_INFO_PROVIDER_TOKEN,
    USER_CAN_VERIFY_USER_IMAGE_INFO_PROVIDER_TOKEN
);

export const MANAGE_SELF_AND_ALL_CAN_EDIT_CHECKER_TOKEN =
    token<ImagePermissionChecker>("ManageSelfAndAllCanEditChecker");
export const MANAGE_SELF_AND_ALL_AND_VERIFY_CHECKER_TOKEN =
    token<ImagePermissionChecker>("ManageSelfAndAllAndVerifyChecker");
export const MANAGE_SELF_AND_ALL_CAN_EDIT_AND_VERIFY_CHECKER_TOKEN =
    token<ImagePermissionChecker>("ManageSelfAndAllCanEditAndVerifyChecker");
