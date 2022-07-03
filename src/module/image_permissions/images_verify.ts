import { Image as ImageProto } from "../../proto/gen/Image";
import { _ImageStatus_Values } from "../../proto/gen/ImageStatus";
import {
    AuthenticatedUserInformation,
    checkUserHasUserPermission,
} from "../../service/utils";
import { UserCanVerifyUserImageInfoProvider } from "../info_providers";
import { UserPermission } from "../schemas";
import {
    ImagePermissionCheckerDecorator,
    ImagePermissionChecker,
} from "./image_permission_checker";

const IMAGES_VERIFY_PERMISSION = "images.verify";

export class ImagesVerifyChecker extends ImagePermissionCheckerDecorator {
    constructor(
        baseChecker: ImagePermissionChecker | null,
        private readonly userCanVerifyUserImageInfoProvider: UserCanVerifyUserImageInfoProvider
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

        if (!this.isImagePublished(image.status)) {
            return false;
        }

        const { userPermissionList } = authUserInfo;
        if (!this.userHasImagesVerifyPermission(userPermissionList)) {
            return false;
        }

        const userId = authUserInfo.user.id;
        const userCanVerifyUserImageList =
            await this.userCanVerifyUserImageInfoProvider.getUserCanVerifyUserImageListOfUserId(
                userId
            );
        if (userCanVerifyUserImageList.length === 0) {
            return true;
        }

        const userCanVerifyUserImageUserIdSet = new Set([
            ...userCanVerifyUserImageList.map(
                (item) => item.imageOfUserId || 0
            ),
            userId,
        ]);
        return userCanVerifyUserImageUserIdSet.has(image.uploadedByUserId || 0);
    }

    public async checkUserHasPermissionForImageList(
        authUserInfo: AuthenticatedUserInformation,
        imageList: ImageProto[]
    ): Promise<boolean> {
        if (
            await super.checkUserHasPermissionForImageList(
                authUserInfo,
                imageList
            )
        ) {
            return true;
        }

        const isAllImagePublished = imageList.every((image) =>
            this.isImagePublished(image.status)
        );
        if (!isAllImagePublished) {
            return false;
        }

        const { userPermissionList } = authUserInfo;
        if (!this.userHasImagesVerifyPermission(userPermissionList)) {
            return false;
        }

        const userId = authUserInfo.user.id;
        const userCanVerifyUserImageList =
            await this.userCanVerifyUserImageInfoProvider.getUserCanVerifyUserImageListOfUserId(
                userId
            );
        if (userCanVerifyUserImageList.length === 0) {
            return true;
        }

        const userCanVerifyUserImageUserIdSet = new Set([
            ...userCanVerifyUserImageList.map(
                (item) => item.imageOfUserId || 0
            ),
            userId,
        ]);
        return imageList.every((image) => {
            return userCanVerifyUserImageUserIdSet.has(
                image.uploadedByUserId || 0
            );
        });
    }

    private userHasImagesVerifyPermission(
        userPermissionList: UserPermission[]
    ): boolean {
        return checkUserHasUserPermission(
            userPermissionList,
            IMAGES_VERIFY_PERMISSION
        );
    }

    private isImagePublished(
        status:
            | _ImageStatus_Values
            | keyof typeof _ImageStatus_Values
            | undefined
    ): boolean {
        return (
            status === _ImageStatus_Values.PUBLISHED ||
            status === "PUBLISHED" ||
            status === _ImageStatus_Values.VERIFIED ||
            status === "VERIFIED"
        );
    }
}
