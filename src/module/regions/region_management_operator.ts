import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { IMAGE_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { AuthenticatedUserInformation } from "../../service/utils";
import {
    ErrorWithHTTPCode,
    getHttpCodeFromGRPCStatus,
    LOGGER_TOKEN,
    promisifyGRPCCall,
} from "../../utils";
import {
    ImagesManageAllChecker,
    ImagesManageSelfChecker,
    ImagesVerifyAllChecker,
} from "../image_permissions";
import {
    ImageInfoProvider,
    IMAGE_INFO_PROVIDER_TOKEN,
} from "../info_providers";
import {
    Polygon,
    Region,
    RegionOperationLog,
    RegionOperationLogProtoToRegionOperationLogConverter,
    RegionProtoToRegionConverter,
    REGION_OPERATION_LOG_PROTO_TO_REGION_OPERATION_LOG_CONVERTER_TOKEN,
    REGION_PROTO_TO_REGION_CONVERTER_TOKEN,
} from "../schemas";

export interface RegionManagementOperator {
    createRegion(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        border: Polygon,
        holes: Polygon[],
        regionLabelId: number
    ): Promise<Region>;
    updateRegionBoundary(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        regionId: number,
        border: Polygon,
        holes: Polygon[]
    ): Promise<Region>;
    updateRegionLabel(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        regionId: number,
        regionLabelId: number
    ): Promise<Region>;
    deleteRegion(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        regionId: number
    ): Promise<void>;
    getRegionOperationLogList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        regionId: number
    ): Promise<RegionOperationLog[]>;
}

export class RegionManagementOperatorImpl implements RegionManagementOperator {
    private readonly manageAndVerifyPermissionChecker =
        new ImagesVerifyAllChecker(
            new ImagesManageSelfChecker(new ImagesManageAllChecker(null))
        );

    constructor(
        private readonly imageInfoProvider: ImageInfoProvider,
        private readonly regionProtoToRegionConverter: RegionProtoToRegionConverter,
        private readonly regionOperationLogProtoToRegionOperationLogConverter: RegionOperationLogProtoToRegionOperationLogConverter,
        private readonly imageServiceDM: ImageServiceClient,
        private readonly logger: Logger
    ) {}

    public async createRegion(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        border: Polygon,
        holes: Polygon[],
        regionLabelId: number
    ): Promise<Region> {
        const { image: imageProto } = await this.imageInfoProvider.getImage(
            imageId,
            true,
            true
        );
        if (
            !this.manageAndVerifyPermissionChecker.checkUserHasPermissionForImage(
                authenticatedUserInfo,
                imageProto
            )
        ) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode(
                "Failed to create region",
                httpStatus.FORBIDDEN
            );
        }

        const userId = authenticatedUserInfo.user.id;
        const { error: createRegionError, response: createRegionResponse } =
            await promisifyGRPCCall(
                this.imageServiceDM.createRegion.bind(this.imageServiceDM),
                {
                    ofImageId: imageId,
                    drawnByUserId: userId,
                    labeledByUserId: userId,
                    border: border,
                    holes: holes,
                    labelId: regionLabelId,
                }
            );
        if (createRegionError !== null) {
            this.logger.error("failed to call image_service.createRegion()", {
                error: createRegionError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to create region",
                getHttpCodeFromGRPCStatus(createRegionError.code)
            );
        }

        const regionProto = createRegionResponse?.region;
        return await this.regionProtoToRegionConverter.convert(regionProto);
    }

    public async updateRegionBoundary(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        regionId: number,
        border: Polygon,
        holes: Polygon[]
    ): Promise<Region> {
        const { image: imageProto } = await this.imageInfoProvider.getImage(
            imageId,
            true,
            true
        );
        if (
            !this.manageAndVerifyPermissionChecker.checkUserHasPermissionForImage(
                authenticatedUserInfo,
                imageProto
            )
        ) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode(
                "Failed to update region boundary",
                httpStatus.FORBIDDEN
            );
        }

        const userId = authenticatedUserInfo.user.id;
        const {
            error: updateRegionBoundaryError,
            response: updateRegionBoundaryResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.updateRegionBoundary.bind(this.imageServiceDM),
            {
                ofImageId: imageId,
                regionId: regionId,
                drawnByUserId: userId,
                border: border,
                holes: holes,
            }
        );
        if (updateRegionBoundaryError !== null) {
            this.logger.error(
                "failed to call image_service.updateRegionBoundary()",
                { error: updateRegionBoundaryError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to update region boundary",
                getHttpCodeFromGRPCStatus(updateRegionBoundaryError.code)
            );
        }

        const regionProto = updateRegionBoundaryResponse?.region;
        return await this.regionProtoToRegionConverter.convert(regionProto);
    }

    public async updateRegionLabel(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        regionId: number,
        regionLabelId: number
    ): Promise<Region> {
        const { image: imageProto } = await this.imageInfoProvider.getImage(
            imageId,
            true,
            true
        );
        if (
            !this.manageAndVerifyPermissionChecker.checkUserHasPermissionForImage(
                authenticatedUserInfo,
                imageProto
            )
        ) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode(
                "Failed to update region's region label",
                httpStatus.FORBIDDEN
            );
        }

        const userId = authenticatedUserInfo.user.id;
        const {
            error: updateRegionRegionLabelError,
            response: updateRegionRegionLabelResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.updateRegionRegionLabel.bind(
                this.imageServiceDM
            ),
            {
                ofImageId: imageId,
                regionId: regionId,
                labeledByUserId: userId,
                labelId: regionLabelId,
            }
        );
        if (updateRegionRegionLabelError !== null) {
            this.logger.error(
                "failed to call image_service.updateRegionRegionLabel()",
                { error: updateRegionRegionLabelError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to update region's region label",
                getHttpCodeFromGRPCStatus(updateRegionRegionLabelError.code)
            );
        }

        const regionProto = updateRegionRegionLabelResponse?.region;
        return await this.regionProtoToRegionConverter.convert(regionProto);
    }

    public async deleteRegion(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        regionId: number
    ): Promise<void> {
        const { image: imageProto } = await this.imageInfoProvider.getImage(
            imageId,
            true,
            true
        );
        if (
            !this.manageAndVerifyPermissionChecker.checkUserHasPermissionForImage(
                authenticatedUserInfo,
                imageProto
            )
        ) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode(
                "Failed to create region",
                httpStatus.FORBIDDEN
            );
        }

        const { error: deleteRegionError } = await promisifyGRPCCall(
            this.imageServiceDM.deleteRegion.bind(this.imageServiceDM),
            {
                ofImageId: imageId,
                regionId: regionId,
            }
        );
        if (deleteRegionError !== null) {
            this.logger.error("failed to call image_service.deleteRegion()", {
                error: deleteRegionError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to delete region",
                getHttpCodeFromGRPCStatus(deleteRegionError.code)
            );
        }
    }

    public async getRegionOperationLogList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageId: number,
        regionId: number
    ): Promise<RegionOperationLog[]> {
        const { image: imageProto } = await this.imageInfoProvider.getImage(
            imageId,
            true,
            true
        );
        if (
            !this.manageAndVerifyPermissionChecker.checkUserHasPermissionForImage(
                authenticatedUserInfo,
                imageProto
            )
        ) {
            this.logger.error("user is not allowed to access image", {
                userId: authenticatedUserInfo.user.id,
                imageId,
            });
            throw new ErrorWithHTTPCode(
                "Failed to get region operation log list",
                httpStatus.FORBIDDEN
            );
        }

        const {
            error: getRegionOperationLogListError,
            response: getRegionOperationLogListResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.getRegionOperationLogList.bind(
                this.imageServiceDM
            ),
            { ofImageId: imageId, regionId: regionId }
        );
        if (getRegionOperationLogListError !== null) {
            this.logger.error(
                "failed to call image_service.getRegionOperationLogList()",
                {
                    error: getRegionOperationLogListError,
                }
            );
            throw new ErrorWithHTTPCode(
                "Failed to delete region",
                getHttpCodeFromGRPCStatus(getRegionOperationLogListError.code)
            );
        }

        const regionOperatorLogProtoList =
            getRegionOperationLogListResponse?.regionOperationLogList || [];
        return await Promise.all(
            regionOperatorLogProtoList.map((logProto) =>
                this.regionOperationLogProtoToRegionOperationLogConverter.convert(
                    logProto
                )
            )
        );
    }
}

injected(
    RegionManagementOperatorImpl,
    IMAGE_INFO_PROVIDER_TOKEN,
    REGION_PROTO_TO_REGION_CONVERTER_TOKEN,
    REGION_OPERATION_LOG_PROTO_TO_REGION_OPERATION_LOG_CONVERTER_TOKEN,
    IMAGE_SERVICE_DM_TOKEN,
    LOGGER_TOKEN
);

export const REGION_MANAGEMENT_OPERATOR_TOKEN = token<RegionManagementOperator>(
    "RegionManagementOperator"
);
