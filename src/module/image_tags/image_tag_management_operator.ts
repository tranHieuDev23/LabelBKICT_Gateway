import { injected, token } from "brandi";
import { Logger } from "winston";
import { IMAGE_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { LOGGER_TOKEN } from "../../utils";
import { ImageTagGroup, ImageTag, ImageType } from "../schemas";

export interface ImageTagManagementOperator {
    createImageTagGroup(
        displayName: string,
        isSingleValue: boolean
    ): Promise<ImageTagGroup>;
    getImageTagGroupList(
        withImageTag: boolean,
        withImageType: boolean
    ): Promise<{
        imageTagGroupList: ImageTagGroup[];
        imageTagList: ImageTag[][] | undefined;
        imageTypeList: ImageType[][] | undefined;
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
    getImageTagGroupListOfImageType(imageTypeID: number): Promise<{
        imageTagGroupList: ImageTagGroup[];
        imageTagList: ImageTag[][];
    }>;
}

export class ImageTagManagementOperatorImpl
    implements ImageTagManagementOperator
{
    constructor(
        private readonly imageServiceDM: ImageServiceClient,
        private readonly logger: Logger
    ) {}

    public async createImageTagGroup(
        displayName: string,
        isSingleValue: boolean
    ): Promise<ImageTagGroup> {
        throw new Error("Method not implemented.");
    }

    public async getImageTagGroupList(
        withImageTag: boolean,
        withImageType: boolean
    ): Promise<{
        imageTagGroupList: ImageTagGroup[];
        imageTagList: ImageTag[][] | undefined;
        imageTypeList: ImageType[][] | undefined;
    }> {
        throw new Error("Method not implemented.");
    }

    public async updateImageTagGroup(
        id: number,
        displayName: string | undefined,
        isSingleValue: boolean | undefined
    ): Promise<ImageTagGroup> {
        throw new Error("Method not implemented.");
    }

    public async deleteImageTagGroup(id: number): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async addImageTagToImageTagGroup(
        imageTypeID: number,
        displayName: string
    ): Promise<ImageTag> {
        throw new Error("Method not implemented.");
    }

    public async updateImageTagOfImageTagGroup(
        imageTypeID: number,
        regionLabelID: number,
        displayName: string | undefined
    ): Promise<ImageTag> {
        throw new Error("Method not implemented.");
    }

    public async removeImageTagFromImageTagGroup(
        imageTypeID: number,
        regionLabelID: number
    ): Promise<ImageTag> {
        throw new Error("Method not implemented.");
    }

    public async getImageTagGroupListOfImageType(imageTypeID: number): Promise<{
        imageTagGroupList: ImageTagGroup[];
        imageTagList: ImageTag[][];
    }> {
        throw new Error("Method not implemented.");
    }
}

injected(ImageTagManagementOperatorImpl, IMAGE_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const IMAGE_TAG_MANAGEMENT_OPERATOR_TOKEN =
    token<ImageTagManagementOperator>("ImageTagManagementOperator");
