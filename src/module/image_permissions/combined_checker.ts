import { injected, token } from "brandi";
import { ImagesManageAllChecker } from "./images_manage_all";
import { ImagesManageSelfChecker } from "./images_manage_self";
import { ImagesVerifyChecker } from "./images_verify";
import { ImagePermissionChecker } from "./image_permission_checker";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { Logger } from "winston";
import { IMAGE_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { LOGGER_TOKEN } from "../../utils";

export function getManageSelfAndAllChecker(
    imageServiceClient: ImageServiceClient,
    logger: Logger
): ImagePermissionChecker {
    return new ImagesManageAllChecker(
        new ImagesManageSelfChecker(null, imageServiceClient, logger),
        imageServiceClient,
        false,
        logger
    );
}

export function getManageSelfAndAllCanEditChecker(
    imageServiceClient: ImageServiceClient,
    logger: Logger
): ImagePermissionChecker {
    return new ImagesManageAllChecker(
        new ImagesManageSelfChecker(null, imageServiceClient, logger),
        imageServiceClient,
        true,
        logger
    );
}

export function getVerifyChecker(imageServiceClient: ImageServiceClient, logger: Logger): ImagePermissionChecker {
    return new ImagesVerifyChecker(null, imageServiceClient, logger);
}

export function getManageSelfAndAllAndVerifyChecker(
    imageServiceClient: ImageServiceClient,
    logger: Logger
): ImagePermissionChecker {
    return new ImagesVerifyChecker(
        new ImagesManageAllChecker(
            new ImagesManageSelfChecker(null, imageServiceClient, logger),
            imageServiceClient,
            false,
            logger
        ),
        imageServiceClient,
        logger
    );
}

export function getManageSelfAndAllCanEditAndVerifyChecker(
    imageServiceClient: ImageServiceClient,
    logger: Logger
): ImagePermissionChecker {
    return new ImagesVerifyChecker(
        new ImagesManageAllChecker(
            new ImagesManageSelfChecker(null, imageServiceClient, logger),
            imageServiceClient,
            true,
            logger
        ),
        imageServiceClient,
        logger
    );
}

injected(getManageSelfAndAllChecker, IMAGE_SERVICE_DM_TOKEN, LOGGER_TOKEN);
injected(getManageSelfAndAllCanEditChecker, IMAGE_SERVICE_DM_TOKEN, LOGGER_TOKEN);
injected(getVerifyChecker, IMAGE_SERVICE_DM_TOKEN, LOGGER_TOKEN);
injected(getManageSelfAndAllAndVerifyChecker, IMAGE_SERVICE_DM_TOKEN, LOGGER_TOKEN);
injected(getManageSelfAndAllCanEditAndVerifyChecker, IMAGE_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const MANAGE_SELF_AND_ALL_CHECKER_TOKEN = token<ImagePermissionChecker>("ManageSelfAndAllChecker");
export const MANAGE_SELF_AND_ALL_CAN_EDIT_CHECKER_TOKEN = token<ImagePermissionChecker>(
    "ManageSelfAndAllCanEditChecker"
);
export const VERIFY_CHECKER_TOKEN = token<ImagePermissionChecker>("VerifyChecker");
export const MANAGE_SELF_AND_ALL_AND_VERIFY_CHECKER_TOKEN = token<ImagePermissionChecker>(
    "ManageSelfAndAllAndVerifyChecker"
);
export const MANAGE_SELF_AND_ALL_CAN_EDIT_AND_VERIFY_CHECKER_TOKEN = token<ImagePermissionChecker>(
    "ManageSelfAndAllCanEditAndVerifyChecker"
);
