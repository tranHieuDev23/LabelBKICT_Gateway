import { Image as ImageProto } from "../../proto/gen/Image";
import {
    AuthenticatedUserInformation,
    checkUserHasUserPermission,
} from "../../service/utils";

export interface ImagePermissionChecker {
    checkUserHasPermissionForImage(
        authUserInfo: AuthenticatedUserInformation,
        image: ImageProto | undefined
    ): boolean;
}

export class ImagePermissionCheckerDecorator implements ImagePermissionChecker {
    constructor(private readonly baseChecker: ImagePermissionChecker | null) {}

    public checkUserHasPermissionForImage(
        authUserInfo: AuthenticatedUserInformation,
        image: ImageProto | undefined
    ): boolean {
        if (this.baseChecker) {
            return this.baseChecker.checkUserHasPermissionForImage(
                authUserInfo,
                image
            );
        }
        return false;
    }
}

const IMAGES_MANAGE_SELF_PERMISSION = "images.manage.self";
const IMAGES_MANAGE_ALL_PERMISSION = "images.manage.all";
const IMAGES_VERIFY_PERMISSION = "images.verify";

export class ImagesManageSelfChecker extends ImagePermissionCheckerDecorator {
    public checkUserHasPermissionForImage(
        authUserInfo: AuthenticatedUserInformation,
        image: ImageProto | undefined
    ): boolean {
        if (super.checkUserHasPermissionForImage(authUserInfo, image)) {
            return true;
        }
        const { user, userPermissionList } = authUserInfo;
        if (
            !checkUserHasUserPermission(
                userPermissionList,
                IMAGES_MANAGE_SELF_PERMISSION
            )
        ) {
            return false;
        }
        return user.id === image?.uploadedByUserId;
    }
}

export class ImagesManageAllChecker extends ImagePermissionCheckerDecorator {
    public checkUserHasPermissionForImage(
        authUserInfo: AuthenticatedUserInformation,
        image: ImageProto | undefined
    ): boolean {
        if (super.checkUserHasPermissionForImage(authUserInfo, image)) {
            return true;
        }
        const { userPermissionList } = authUserInfo;
        return checkUserHasUserPermission(
            userPermissionList,
            IMAGES_MANAGE_ALL_PERMISSION
        );
    }
}

export class ImagesVerifyAllChecker extends ImagePermissionCheckerDecorator {
    public checkUserHasPermissionForImage(
        authUserInfo: AuthenticatedUserInformation,
        image: ImageProto | undefined
    ): boolean {
        if (super.checkUserHasPermissionForImage(authUserInfo, image)) {
            return true;
        }
        const { userPermissionList } = authUserInfo;
        return checkUserHasUserPermission(
            userPermissionList,
            IMAGES_VERIFY_PERMISSION
        );
    }
}
