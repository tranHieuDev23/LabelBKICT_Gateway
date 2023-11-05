import { Logger } from "winston";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { AuthenticatedUserInformation, checkUserHasUserPermission } from "../../service/utils";
import { UserPermission } from "../schemas";
import { ImagePermissionCheckerDecorator, ImagePermissionChecker } from "./image_permission_checker";
import { ErrorWithHTTPCode, getHttpCodeFromGRPCStatus, promisifyGRPCCall } from "../../utils";

const IMAGES_VERIFY_PERMISSION = "images.verify";

export class ImagesVerifyChecker extends ImagePermissionCheckerDecorator {
    constructor(
        baseChecker: ImagePermissionChecker | null,
        private readonly imageServiceClient: ImageServiceClient,
        private readonly logger: Logger
    ) {
        super(baseChecker);
    }

    public async checkUserHasPermissionForImage(
        authUserInfo: AuthenticatedUserInformation,
        imageId: number
    ): Promise<boolean> {
        if (await super.checkUserHasPermissionForImage(authUserInfo, imageId)) {
            return true;
        }

        if (!this.userHasImagesVerifyPermission(authUserInfo.userPermissionList)) {
            return false;
        }

        const { error, response } = await promisifyGRPCCall(
            this.imageServiceClient.checkUserCanVerifyImageList.bind(this.imageServiceClient),
            { userId: authUserInfo.user.id, imageIdList: [imageId] }
        );
        if (error !== null) {
            this.logger.error("failed to call image_service.checkUserCanVerifyImageList()", {
                error,
            });
            throw new ErrorWithHTTPCode(
                "Failed to check if user has permission for image",
                getHttpCodeFromGRPCStatus(error.code)
            );
        }

        const canVerifyList = response?.canVerifyList || [];
        return canVerifyList.every((item) => item);
    }

    public async checkUserHasPermissionForImageList(
        authUserInfo: AuthenticatedUserInformation,
        imageIdList: number[]
    ): Promise<boolean> {
        if (await super.checkUserHasPermissionForImageList(authUserInfo, imageIdList)) {
            return true;
        }

        if (!this.userHasImagesVerifyPermission(authUserInfo.userPermissionList)) {
            return false;
        }

        const { error, response } = await promisifyGRPCCall(
            this.imageServiceClient.checkUserCanVerifyImageList.bind(this.imageServiceClient),
            { userId: authUserInfo.user.id, imageIdList: imageIdList }
        );
        if (error !== null) {
            this.logger.error("failed to call image_service.checkUserCanVerifyImageList()", {
                error,
            });
            throw new ErrorWithHTTPCode(
                "Failed to check if user has permission for image",
                getHttpCodeFromGRPCStatus(error.code)
            );
        }

        const canVerifyList = response?.canVerifyList || [];
        return canVerifyList.every((item) => item);
    }

    private userHasImagesVerifyPermission(userPermissionList: UserPermission[]): boolean {
        return checkUserHasUserPermission(userPermissionList, IMAGES_VERIFY_PERMISSION);
    }
}
