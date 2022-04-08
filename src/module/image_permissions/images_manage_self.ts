import { Image as ImageProto } from "../../proto/gen/Image";
import {
    AuthenticatedUserInformation,
    checkUserHasUserPermission,
} from "../../service/utils";
import { ImagePermissionCheckerDecorator } from "./image_permission_checker";

const IMAGES_MANAGE_SELF_PERMISSION = "images.manage.self";

export class ImagesManageSelfChecker extends ImagePermissionCheckerDecorator {
    public async checkUserHasPermissionForImage(
        authUserInfo: AuthenticatedUserInformation,
        image: ImageProto
    ): Promise<boolean> {
        if (await super.checkUserHasPermissionForImage(authUserInfo, image)) {
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

    public async checkUserHasPermissionForImageList(
        authUserInfo: AuthenticatedUserInformation,
        imageList: ImageProto[]
    ): Promise<boolean> {
        return imageList.every((image) =>
            this.checkUserHasPermissionForImage(authUserInfo, image)
        );
    }
}
