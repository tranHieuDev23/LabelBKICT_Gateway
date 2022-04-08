import { Image as ImageProto } from "../../proto/gen/Image";
import { AuthenticatedUserInformation } from "../../service/utils";

export interface ImagePermissionChecker {
    checkUserHasPermissionForImage(
        authUserInfo: AuthenticatedUserInformation,
        image: ImageProto
    ): Promise<boolean>;
    checkUserHasPermissionForImageList(
        authUserInfo: AuthenticatedUserInformation,
        image: ImageProto[]
    ): Promise<boolean>;
}

export class ImagePermissionCheckerDecorator implements ImagePermissionChecker {
    constructor(private readonly baseChecker: ImagePermissionChecker | null) {}

    public async checkUserHasPermissionForImage(
        authUserInfo: AuthenticatedUserInformation,
        image: ImageProto
    ): Promise<boolean> {
        if (this.baseChecker) {
            return this.baseChecker.checkUserHasPermissionForImage(
                authUserInfo,
                image
            );
        }
        return false;
    }

    public async checkUserHasPermissionForImageList(
        authUserInfo: AuthenticatedUserInformation,
        imageList: ImageProto[]
    ): Promise<boolean> {
        if (this.baseChecker) {
            return this.baseChecker.checkUserHasPermissionForImageList(
                authUserInfo,
                imageList
            );
        }
        return false;
    }
}
