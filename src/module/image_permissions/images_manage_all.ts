import { Logger } from "winston";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { AuthenticatedUserInformation, checkUserHasUserPermission } from "../../service/utils";
import { ErrorWithHTTPCode, getHttpCodeFromGRPCStatus, promisifyGRPCCall } from "../../utils";
import { UserPermission } from "../schemas";
import { ImagePermissionCheckerDecorator, ImagePermissionChecker } from "./image_permission_checker";

const IMAGES_MANAGE_ALL_PERMISSION = "images.manage.all";

export class ImagesManageAllChecker extends ImagePermissionCheckerDecorator {
    constructor(
        baseChecker: ImagePermissionChecker | null,
        private readonly imageServiceClient: ImageServiceClient,
        private readonly canEdit: boolean,
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

        if (!this.userHasImagesManageAllPermission(authUserInfo.userPermissionList)) {
            return false;
        }

        const { error, response } = await promisifyGRPCCall(
            this.imageServiceClient.checkUserCanManageImageList.bind(this.imageServiceClient),
            { userId: authUserInfo.user.id, imageIdList: [imageId] }
        );
        if (error !== null) {
            this.logger.error("failed to call image_service.checkUserCanManageImageList()", {
                error,
            });
            throw new ErrorWithHTTPCode(
                "Failed to check if user has permission for image",
                getHttpCodeFromGRPCStatus(error.code)
            );
        }

        const canManageList = response?.canManageList || [];
        const canEditList = response?.canEditList || [];

        if (this.canEdit) {
            if (!canEditList.every((item) => item)) {
                return false;
            }
        }

        return canManageList.every((item) => item);
    }

    public async checkUserHasPermissionForImageList(
        authUserInfo: AuthenticatedUserInformation,
        imageIdList: number[]
    ): Promise<boolean> {
        if (await super.checkUserHasPermissionForImageList(authUserInfo, imageIdList)) {
            return true;
        }

        if (!this.userHasImagesManageAllPermission(authUserInfo.userPermissionList)) {
            return false;
        }

        const { error, response } = await promisifyGRPCCall(
            this.imageServiceClient.checkUserCanManageImageList.bind(this.imageServiceClient),
            { userId: authUserInfo.user.id, imageIdList }
        );
        if (error !== null) {
            this.logger.error("failed to call image_service.checkUserCanManageImageList()", {
                error,
            });
            throw new ErrorWithHTTPCode(
                "Failed to check if user has permission for image",
                getHttpCodeFromGRPCStatus(error.code)
            );
        }

        const canManageList = response?.canManageList || [];
        const canEditList = response?.canEditList || [];

        if (this.canEdit) {
            if (!canEditList.every((item) => item)) {
                return false;
            }
        }

        return canManageList.every((item) => item);
    }

    private userHasImagesManageAllPermission(userPermissionList: UserPermission[]): boolean {
        return checkUserHasUserPermission(userPermissionList, IMAGES_MANAGE_ALL_PERMISSION);
    }
}
