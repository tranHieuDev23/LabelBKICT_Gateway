import { injected, token } from "brandi";
import { Logger } from "winston";
import { IMAGE_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { LOGGER_TOKEN } from "../../utils";
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
    ): Promise<RegionLabel>;
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
        throw new Error("Method not implemented.");
    }

    public async getImageTypeList(withRegionLabel: boolean): Promise<{
        imageTypeList: ImageType[];
        regionLabelList: RegionLabel[][] | undefined;
    }> {
        throw new Error("Method not implemented.");
    }

    public async updateImageType(
        id: number,
        displayName: string | undefined,
        hasPredictiveModel: boolean | undefined
    ): Promise<ImageType> {
        throw new Error("Method not implemented.");
    }

    public async deleteImageType(id: number): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async addRegionLabelToImageType(
        imageTypeID: number,
        displayName: string,
        color: string
    ): Promise<RegionLabel> {
        throw new Error("Method not implemented.");
    }

    public async updateRegionLabelOfImageType(
        imageTypeID: number,
        regionLabelID: number,
        displayName: string | undefined,
        color: string | undefined
    ): Promise<RegionLabel> {
        throw new Error("Method not implemented.");
    }

    public async removeRegionLabelFromImageType(
        imageTypeID: number,
        regionLabelID: number
    ): Promise<RegionLabel> {
        throw new Error("Method not implemented.");
    }
}

injected(ImageTypeManagementOperatorImpl, IMAGE_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const IMAGE_TYPE_MANAGEMENT_OPERATOR_TOKEN =
    token<ImageTypeManagementOperator>("ImageTypeManagementOperator");
