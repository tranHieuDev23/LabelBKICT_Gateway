import { AuthenticatedUserInformation } from "../../service/utils";

export interface ImagePermissionChecker {
    checkUserHasPermissionForImage(authUserInfo: AuthenticatedUserInformation, imageId: number): Promise<boolean>;
    checkUserHasPermissionForImageList(
        authUserInfo: AuthenticatedUserInformation,
        imageIdList: number[]
    ): Promise<boolean>;
}

export class ImagePermissionCheckerDecorator implements ImagePermissionChecker {
    constructor(private readonly baseChecker: ImagePermissionChecker | null) {}

    public async checkUserHasPermissionForImage(
        authUserInfo: AuthenticatedUserInformation,
        imageId: number
    ): Promise<boolean> {
        if (this.baseChecker) {
            return this.baseChecker.checkUserHasPermissionForImage(authUserInfo, imageId);
        }
        return false;
    }

    public async checkUserHasPermissionForImageList(
        authUserInfo: AuthenticatedUserInformation,
        imageIdList: number[]
    ): Promise<boolean> {
        if (this.baseChecker) {
            return this.baseChecker.checkUserHasPermissionForImageList(authUserInfo, imageIdList);
        }
        return false;
    }
}
