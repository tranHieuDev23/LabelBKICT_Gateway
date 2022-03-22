import { injected, token } from "brandi";
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
    updateImageType(
        id: number,
        displayName: string | undefined,
        hasPredictiveModel: boolean | undefined
    ): Promise<ImageType>;
    deleteImageType(id: number): Promise<void>;
    addRegionLabelToImageType(
        imageTypeID: number,
        displayName: string,
        color: string
    ): Promise<RegionLabel>;
    updateRegionLabelOfImageType(
        imageTypeID: number,
        regionLabelID: number,
        displayName: string | undefined,
        color: string | undefined
    ): Promise<RegionLabel>;
    removeRegionLabelFromImageType(
        imageTypeID: number,
        regionLabelID: number
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

        return {
            imageTypeList:
                getImageTypeListResponse?.imageTypeList?.map(
                    ImageType.fromProto
                ) || [],
            regionLabelList:
                getImageTypeListResponse?.regionLabelListOfImageTypeList?.map(
                    (regionLabelList) =>
                        regionLabelList.regionLabelList?.map(
                            RegionLabel.fromProto
                        ) || []
                ),
        };
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
                "failed to update image type",
                getHttpCodeFromGRPCStatus(deleteImageTypeError.code)
            );
        }
    }

    public async addRegionLabelToImageType(
        imageTypeID: number,
        displayName: string,
        color: string
    ): Promise<RegionLabel> {
        const {
            error: createRegionLabelError,
            response: createRegionLabelResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.createRegionLabel.bind(this.imageServiceDM),
            { ofImageTypeId: imageTypeID, displayName, color }
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
        imageTypeID: number,
        regionLabelID: number,
        displayName: string | undefined,
        color: string | undefined
    ): Promise<RegionLabel> {
        const {
            error: updateRegionLabelError,
            response: updateRegionLabelResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.updateRegionLabel.bind(this.imageServiceDM),
            {
                ofImageTypeId: imageTypeID,
                id: regionLabelID,
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
        imageTypeID: number,
        regionLabelID: number
    ): Promise<void> {
        const { error: deleteRegionLabel } = await promisifyGRPCCall(
            this.imageServiceDM.deleteRegionLabel.bind(this.imageServiceDM),
            {
                ofImageTypeId: imageTypeID,
                id: regionLabelID,
            }
        );
        if (deleteRegionLabel !== null) {
            this.logger.error(
                "failed to call image_service.updateRegionLabel()",
                { error: deleteRegionLabel }
            );
            throw new ErrorWithHTTPCode(
                "failed to update region label",
                getHttpCodeFromGRPCStatus(deleteRegionLabel.code)
            );
        }
    }
}

injected(ImageTypeManagementOperatorImpl, IMAGE_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const IMAGE_TYPE_MANAGEMENT_OPERATOR_TOKEN =
    token<ImageTypeManagementOperator>("ImageTypeManagementOperator");
