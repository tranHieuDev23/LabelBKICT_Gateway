import { Logger } from "winston";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { AuthenticatedUserInformation, checkUserHasUserPermission } from "../../service/utils";
import { ImagePermissionChecker, ImagePermissionCheckerDecorator } from "./image_permission_checker";
import { ErrorWithHTTPCode, getHttpCodeFromGRPCStatus, promisifyGRPCCall } from "../../utils";

const IMAGES_MANAGE_SELF_PERMISSION = "images.manage.self";

export class ImagesManageSelfChecker extends ImagePermissionCheckerDecorator {
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

        if (!checkUserHasUserPermission(authUserInfo.userPermissionList, IMAGES_MANAGE_SELF_PERMISSION)) {
            return false;
        }

        const { error, response } = await promisifyGRPCCall(
            this.imageServiceClient.getImage.bind(this.imageServiceClient),
            { id: imageId }
        );
        if (error !== null) {
            this.logger.error("failed to call image_service.getImage()", {
                error,
            });
            throw new ErrorWithHTTPCode(
                "Failed to check if user has permission for image",
                getHttpCodeFromGRPCStatus(error.code)
            );
        }

        return authUserInfo.user.id === response?.image?.uploadedByUserId;
    }

    public async checkUserHasPermissionForImageList(
        authUserInfo: AuthenticatedUserInformation,
        imageIdList: number[]
    ): Promise<boolean> {
        if (await super.checkUserHasPermissionForImageList(authUserInfo, imageIdList)) {
            return true;
        }

        if (!checkUserHasUserPermission(authUserInfo.userPermissionList, IMAGES_MANAGE_SELF_PERMISSION)) {
            return false;
        }

        const { error, response } = await promisifyGRPCCall(
            this.imageServiceClient.getImageList.bind(this.imageServiceClient),
            { filterOptions: { imageIdList }, offset: 0, limit: imageIdList.length }
        );
        if (error !== null) {
            this.logger.error("failed to call image_service.getImageList()", {
                error,
            });
            throw new ErrorWithHTTPCode(
                "Failed to check if user has permission for image",
                getHttpCodeFromGRPCStatus(error.code)
            );
        }

        const imageList = response?.imageList || [];
        return imageList.every((image) => {
            authUserInfo.user.id === image?.uploadedByUserId;
        });
    }
}
