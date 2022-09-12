import { Image as ImageProto } from "../../proto/gen/Image";
import { AuthenticatedUserInformation, checkUserHasUserPermission } from "../../service/utils";
import { UserCanManageUserImageInfoProvider } from "../info_providers";
import { UserPermission } from "../schemas";
import { ImagePermissionCheckerDecorator, ImagePermissionChecker } from "./image_permission_checker";

const IMAGES_MANAGE_ALL_PERMISSION = "images.manage.all";

export class ImagesManageAllChecker extends ImagePermissionCheckerDecorator {
    constructor(
        baseChecker: ImagePermissionChecker | null,
        private readonly userCanManageUserImageInfoProvider: UserCanManageUserImageInfoProvider,
        private readonly canEdit: boolean
    ) {
        super(baseChecker);
    }

    public async checkUserHasPermissionForImage(
        authUserInfo: AuthenticatedUserInformation,
        image: ImageProto
    ): Promise<boolean> {
        if (await super.checkUserHasPermissionForImage(authUserInfo, image)) {
            return true;
        }

        const { userPermissionList } = authUserInfo;
        if (!this.userHasImagesManageAllPermission(userPermissionList)) {
            return false;
        }

        const userId = authUserInfo.user.id;
        const userCanManageUserImageList =
            await this.userCanManageUserImageInfoProvider.getUserCanManageUserImageListOfUserId(userId);
        if (userCanManageUserImageList.length === 0) {
            return true;
        }

        const userCanManageUserImageUserIdSet = this.canEdit
            ? new Set([
                  ...userCanManageUserImageList.filter((item) => item.canEdit).map((item) => item.imageOfUserId || 0),
                  userId,
              ])
            : new Set([...userCanManageUserImageList.map((item) => item.imageOfUserId || 0), userId]);
        return userCanManageUserImageUserIdSet.has(image.uploadedByUserId || 0);
    }

    public async checkUserHasPermissionForImageList(
        authUserInfo: AuthenticatedUserInformation,
        imageList: ImageProto[]
    ): Promise<boolean> {
        if (await super.checkUserHasPermissionForImageList(authUserInfo, imageList)) {
            return true;
        }

        const { userPermissionList } = authUserInfo;
        if (!this.userHasImagesManageAllPermission(userPermissionList)) {
            return false;
        }

        const userId = authUserInfo.user.id;
        const userCanManageUserImageList =
            await this.userCanManageUserImageInfoProvider.getUserCanManageUserImageListOfUserId(userId);
        if (userCanManageUserImageList.length === 0) {
            return true;
        }

        const userCanManageUserImageUserIdSet = this.canEdit
            ? new Set([
                  ...userCanManageUserImageList.filter((item) => item.canEdit).map((item) => item.imageOfUserId || 0),
                  userId,
              ])
            : new Set([...userCanManageUserImageList.map((item) => item.imageOfUserId || 0), userId]);
        return imageList.every((image) => {
            return userCanManageUserImageUserIdSet.has(image.uploadedByUserId || 0);
        });
    }

    private userHasImagesManageAllPermission(userPermissionList: UserPermission[]): boolean {
        return checkUserHasUserPermission(userPermissionList, IMAGES_MANAGE_ALL_PERMISSION);
    }
}
