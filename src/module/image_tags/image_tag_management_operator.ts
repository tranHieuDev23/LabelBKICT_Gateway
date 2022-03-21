import { ImageTagGroup, ImageTag } from "../schemas";

export interface ImageTagGroupManagementOperator {
    createImageTagGroup(
        displayName: string,
        isSingleValue: boolean
    ): Promise<ImageTagGroup>;
    getImageTagGroupList(withImageTag: boolean): Promise<{
        imageTypeList: ImageTagGroup[];
        regionLabelList: ImageTag[][] | undefined;
    }>;
    updateImageTagGroup(
        id: number,
        displayName: string | undefined,
        isSingleValue: boolean | undefined
    ): Promise<ImageTagGroup>;
    deleteImageTagGroup(id: number): Promise<void>;
    addImageTagToImageTagGroup(
        imageTypeID: number,
        displayName: string
    ): Promise<ImageTag>;
    updateImageTagOfImageTagGroup(
        imageTypeID: number,
        regionLabelID: number,
        displayName: string | undefined
    ): Promise<ImageTag>;
    removeImageTagFromImageTagGroup(
        imageTypeID: number,
        regionLabelID: number
    ): Promise<ImageTag>;
}
