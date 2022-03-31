import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { IMAGE_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import {
    ErrorWithHTTPCode,
    getHttpCodeFromGRPCStatus,
    LOGGER_TOKEN,
    promisifyGRPCCall,
} from "../../utils";
import { ImageType, RegionLabel } from "../schemas";

export interface ImageTypeManagementOperator {
    createImageType(
        displayName: string,
        hasPredictiveModel: boolean
    ): Promise<ImageType>;
    getImageTypeList(withRegionLabel: boolean): Promise<{
        imageTypeList: ImageType[];
        regionLabelList: RegionLabel[][] | undefined;
    }>;
    getImageType(id: number): Promise<{
        imageType: ImageType;
        regionLabelList: RegionLabel[];
    }>;
    updateImageType(
        id: number,
        displayName: string | undefined,
        hasPredictiveModel: boolean | undefined
    ): Promise<ImageType>;
    deleteImageType(id: number): Promise<void>;
    addRegionLabelToImageType(
        imageTypeId: number,
        displayName: string,
        color: string
    ): Promise<RegionLabel>;
    updateRegionLabelOfImageType(
        imageTypeId: number,
        regionLabelId: number,
        displayName: string | undefined,
        color: string | undefined
    ): Promise<RegionLabel>;
    removeRegionLabelFromImageType(
        imageTypeId: number,
        regionLabelId: number
    ): Promise<void>;
}

export class ImageTypeManagementOperatorImpl
    implements ImageTypeManagementOperator
{
    constructor(
        private readonly imageServiceDM: ImageServiceClient,
        private readonly logger: Logger
    ) {}

    public async createImageType(
        displayName: string,
        hasPredictiveModel: boolean
    ): Promise<ImageType> {
        const {
            error: createImageTypeError,
            response: createImageTypeResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.createImageType.bind(this.imageServiceDM),
            { displayName, hasPredictiveModel }
        );
        if (createImageTypeError !== null) {
            this.logger.error(
                "failed to call image_service.createImageType()",
                { error: createImageTypeError }
            );
            throw new ErrorWithHTTPCode(
                "failed to create new image type",
                getHttpCodeFromGRPCStatus(createImageTypeError.code)
            );
        }

        return ImageType.fromProto(createImageTypeResponse?.imageType);
    }

    public async getImageTypeList(withRegionLabel: boolean): Promise<{
        imageTypeList: ImageType[];
        regionLabelList: RegionLabel[][] | undefined;
    }> {
        const {
            error: getImageTypeListError,
            response: getImageTypeListResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.getImageTypeList.bind(this.imageServiceDM),
            { withRegionLabel }
        );
        if (getImageTypeListError !== null) {
            this.logger.error(
                "failed to call image_service.getImageTypeList()",
                { error: getImageTypeListError }
            );
            throw new ErrorWithHTTPCode(
                "failed to get image type list",
                getHttpCodeFromGRPCStatus(getImageTypeListError.code)
            );
        }

        const imageTypeList =
            getImageTypeListResponse?.imageTypeList?.map(ImageType.fromProto) ||
            [];
        const regionLabelList = withRegionLabel
            ? getImageTypeListResponse?.regionLabelListOfImageTypeList?.map(
                  (regionLabelList) =>
                      regionLabelList.regionLabelList?.map(
                          RegionLabel.fromProto
                      ) || []
              ) || []
            : undefined;

        return { imageTypeList, regionLabelList };
    }

    public async getImageType(id: number): Promise<{
        imageType: ImageType;
        regionLabelList: RegionLabel[];
    }> {
        const { error: getImageTypeError, response: getImageTypeResponse } =
            await promisifyGRPCCall(
                this.imageServiceDM.getImageType.bind(this.imageServiceDM),
                {
                    id,
                }
            );
        if (getImageTypeError !== null) {
            this.logger.error("failed to call image_service.getImageType()", {
                error: getImageTypeError,
            });
            throw new ErrorWithHTTPCode(
                "failed to get image type",
                getHttpCodeFromGRPCStatus(getImageTypeError.code)
            );
        }

        if (getImageTypeResponse?.imageType === undefined) {
            this.logger.error(
                "invalid response from image_service.getImageType()"
            );
            throw new ErrorWithHTTPCode(
                "failed to get image type",
                httpStatus.INTERNAL_SERVER_ERROR
            );
        }

        const imageType = ImageType.fromProto(getImageTypeResponse.imageType);
        const regionLabelList = (
            getImageTypeResponse.regionLabelList || []
        ).map(RegionLabel.fromProto);
        return { imageType, regionLabelList };
    }

    public async updateImageType(
        id: number,
        displayName: string | undefined,
        hasPredictiveModel: boolean | undefined
    ): Promise<ImageType> {
        const {
            error: updateImageTypeError,
            response: updateImageTypeResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.updateImageType.bind(this.imageServiceDM),
            { id, displayName, hasPredictiveModel }
        );
        if (updateImageTypeError !== null) {
            this.logger.error(
                "failed to call image_service.updateImageType()",
                { error: updateImageTypeError }
            );
            throw new ErrorWithHTTPCode(
                "failed to update image type",
                getHttpCodeFromGRPCStatus(updateImageTypeError.code)
            );
        }

        return ImageType.fromProto(updateImageTypeResponse?.imageType);
    }

    public async deleteImageType(id: number): Promise<void> {
        const { error: deleteImageTypeError } = await promisifyGRPCCall(
            this.imageServiceDM.deleteImageType.bind(this.imageServiceDM),
            { id }
        );
        if (deleteImageTypeError !== null) {
            this.logger.error(
                "failed to call image_service.deleteImageType()",
                { error: deleteImageTypeError }
            );
            throw new ErrorWithHTTPCode(
                "failed to delete image type",
                getHttpCodeFromGRPCStatus(deleteImageTypeError.code)
            );
        }
    }

    public async addRegionLabelToImageType(
        imageTypeId: number,
        displayName: string,
        color: string
    ): Promise<RegionLabel> {
        const {
            error: createRegionLabelError,
            response: createRegionLabelResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.createRegionLabel.bind(this.imageServiceDM),
            { ofImageTypeId: imageTypeId, displayName, color }
        );
        if (createRegionLabelError !== null) {
            this.logger.error(
                "failed to call image_service.createRegionLabel()",
                { error: createRegionLabelError }
            );
            throw new ErrorWithHTTPCode(
                "failed to create region label",
                getHttpCodeFromGRPCStatus(createRegionLabelError.code)
            );
        }

        return RegionLabel.fromProto(createRegionLabelResponse?.regionLabel);
    }

    public async updateRegionLabelOfImageType(
        imageTypeId: number,
        regionLabelId: number,
        displayName: string | undefined,
        color: string | undefined
    ): Promise<RegionLabel> {
        const {
            error: updateRegionLabelError,
            response: updateRegionLabelResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.updateRegionLabel.bind(this.imageServiceDM),
            {
                ofImageTypeId: imageTypeId,
                id: regionLabelId,
                displayName,
                color,
            }
        );
        if (updateRegionLabelError !== null) {
            this.logger.error(
                "failed to call image_service.updateRegionLabel()",
                { error: updateRegionLabelError }
            );
            throw new ErrorWithHTTPCode(
                "failed to update region label",
                getHttpCodeFromGRPCStatus(updateRegionLabelError.code)
            );
        }

        return RegionLabel.fromProto(updateRegionLabelResponse?.regionLabel);
    }

    public async removeRegionLabelFromImageType(
        imageTypeId: number,
        regionLabelId: number
    ): Promise<void> {
        const { error: deleteRegionLabel } = await promisifyGRPCCall(
            this.imageServiceDM.deleteRegionLabel.bind(this.imageServiceDM),
            {
                ofImageTypeId: imageTypeId,
                id: regionLabelId,
            }
        );
        if (deleteRegionLabel !== null) {
            this.logger.error(
                "failed to call image_service.updateRegionLabel()",
                { error: deleteRegionLabel }
            );
            throw new ErrorWithHTTPCode(
                "failed to delete region label",
                getHttpCodeFromGRPCStatus(deleteRegionLabel.code)
            );
        }
    }
}

injected(ImageTypeManagementOperatorImpl, IMAGE_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const IMAGE_TYPE_MANAGEMENT_OPERATOR_TOKEN =
    token<ImageTypeManagementOperator>("ImageTypeManagementOperator");
