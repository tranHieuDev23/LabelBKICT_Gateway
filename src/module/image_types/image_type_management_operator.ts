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
