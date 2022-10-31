import { injected, token } from "brandi";
import { Logger } from "winston";
import { IMAGE_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { ImageTagGroupAndTagList } from "../../proto/gen/ImageTagGroupAndTagList";
import {
    ErrorWithHTTPCode,
    getHttpCodeFromGRPCStatus,
    LOGGER_TOKEN,
    promisifyGRPCCall,
} from "../../utils";
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
        imageTypeId: number,
        displayName: string
    ): Promise<ImageTag>;
    updateImageTagOfImageTagGroup(
        imageTypeId: number,
        ImageTagId: number,
        displayName: string | undefined
    ): Promise<ImageTag>;
    removeImageTagFromImageTagGroup(
        imageTypeId: number,
        ImageTagId: number
    ): Promise<void>;
    addImageTypeToImageTagGroup(
        imageTagGroupId: number,
        imageTypeId: number
    ): Promise<void>;
    removeImageTypeFromImageTagGroup(
        imageTagGroupId: number,
        imageTypeId: number
    ): Promise<void>;
    getImageTagGroupListOfImageType(imageTypeId: number): Promise<{
        imageTagGroupList: ImageTagGroup[];
        imageTagList: ImageTag[][];
    }>;
    getImageTagGroupListOfImageTypeList(imageTypeIdList: number[]): Promise<
        Array<{
            imageTagGroupList: ImageTagGroup[];
            imageTagList: ImageTag[][];
        }>
    >;
}

export class ImageTagManagementOperatorImpl implements ImageTagManagementOperator {
    constructor(
        private readonly imageServiceDM: ImageServiceClient,
        private readonly logger: Logger
    ) { }

    public async createImageTagGroup(
        displayName: string,
        isSingleValue: boolean
    ): Promise<ImageTagGroup> {
        const { error: createImageTagError, response: createImageTagResponse } =
            await promisifyGRPCCall(
                this.imageServiceDM.createImageTagGroup.bind(
                    this.imageServiceDM
                ),
                { displayName, isSingleValue }
            );
        if (createImageTagError !== null) {
            this.logger.error(
                "failed to call image_service.createImageTagGroup()",
                { error: createImageTagError }
            );
            throw new ErrorWithHTTPCode(
                "failed to create new image tag group",
                getHttpCodeFromGRPCStatus(createImageTagError.code)
            );
        }

        return ImageTagGroup.fromProto(createImageTagResponse?.imageTagGroup);
    }

    public async getImageTagGroupList(
        withImageTag: boolean,
        withImageType: boolean
    ): Promise<{
        imageTagGroupList: ImageTagGroup[];
        imageTagList: ImageTag[][] | undefined;
        imageTypeList: ImageType[][] | undefined;
    }> {
        const {
            error: getImageTagGroupListError,
            response: getImageTagGroupListResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.getImageTagGroupList.bind(this.imageServiceDM),
            { withImageTag, withImageType }
        );
        if (getImageTagGroupListError !== null) {
            this.logger.error(
                "failed to call image_service.getImageTagGroupList()",
                { error: getImageTagGroupListError }
            );
            throw new ErrorWithHTTPCode(
                "failed to get image tag group list",
                getHttpCodeFromGRPCStatus(getImageTagGroupListError.code)
            );
        }

        const imageTagGroupList =
            getImageTagGroupListResponse?.imageTagGroupList?.map(
                ImageTagGroup.fromProto
            ) || [];
        const imageTagList = withImageTag
            ? getImageTagGroupListResponse?.imageTagListOfImageTagGroupList?.map(
                (imageTagList) =>
                    imageTagList.imageTagList?.map(ImageTag.fromProto) || []
            ) || []
            : undefined;
        const imageTypeList = withImageType
            ? getImageTagGroupListResponse?.imageTypeListOfImageTagGroupList?.map(
                (imageTypeList) =>
                    imageTypeList.imageTypeList?.map(ImageType.fromProto) ||
                    []
            ) || []
            : undefined;

        return { imageTagGroupList, imageTagList, imageTypeList };
    }

    public async updateImageTagGroup(
        id: number,
        displayName: string | undefined,
        isSingleValue: boolean | undefined
    ): Promise<ImageTagGroup> {
        const {
            error: updateImageTagGroupError,
            response: updateImageTagGroupResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.updateImageTagGroup.bind(this.imageServiceDM),
            { id, displayName, isSingleValue }
        );
        if (updateImageTagGroupError !== null) {
            this.logger.error(
                "failed to call image_service.updateImageTagGroup()",
                { error: updateImageTagGroupError }
            );
            throw new ErrorWithHTTPCode(
                "failed to update image tag group",
                getHttpCodeFromGRPCStatus(updateImageTagGroupError.code)
            );
        }

        return ImageTagGroup.fromProto(
            updateImageTagGroupResponse?.imageTagGroup
        );
    }

    public async deleteImageTagGroup(id: number): Promise<void> {
        const { error: deleteImageTagGroupError } = await promisifyGRPCCall(
            this.imageServiceDM.deleteImageTagGroup.bind(this.imageServiceDM),
            { id }
        );
        if (deleteImageTagGroupError !== null) {
            this.logger.error(
                "failed to call image_service.deleteImageTagGroup()",
                { error: deleteImageTagGroupError }
            );
            throw new ErrorWithHTTPCode(
                "failed to delete image tag group",
                getHttpCodeFromGRPCStatus(deleteImageTagGroupError.code)
            );
        }
    }

    public async addImageTagToImageTagGroup(
        imageTagGroupId: number,
        displayName: string
    ): Promise<ImageTag> {
        const { error: createImageTagError, response: createImageTagResponse } =
            await promisifyGRPCCall(
                this.imageServiceDM.createImageTag.bind(this.imageServiceDM),
                { ofImageTagGroupId: imageTagGroupId, displayName }
            );
        if (createImageTagError !== null) {
            this.logger.error("failed to call image_service.createImageTag()", {
                error: createImageTagError,
            });
            throw new ErrorWithHTTPCode(
                "failed to create image tag",
                getHttpCodeFromGRPCStatus(createImageTagError.code)
            );
        }

        return ImageTag.fromProto(createImageTagResponse?.imageTag);
    }

    public async updateImageTagOfImageTagGroup(
        imageTagGroupId: number,
        imageTagId: number,
        displayName: string | undefined
    ): Promise<ImageTag> {
        const { error: updateImageTagError, response: updateImageTagResponse } =
            await promisifyGRPCCall(
                this.imageServiceDM.updateImageTag.bind(this.imageServiceDM),
                {
                    ofImageTagGroupId: imageTagGroupId,
                    id: imageTagId,
                    displayName,
                }
            );
        if (updateImageTagError !== null) {
            this.logger.error("failed to call image_service.updateImageTag()", {
                error: updateImageTagError,
            });
            throw new ErrorWithHTTPCode(
                "failed to update image tag",
                getHttpCodeFromGRPCStatus(updateImageTagError.code)
            );
        }

        return ImageTag.fromProto(updateImageTagResponse?.imageTag);
    }

    public async removeImageTagFromImageTagGroup(
        imageTagGroupId: number,
        imageTagId: number
    ): Promise<void> {
        const { error: deleteImageTagError } = await promisifyGRPCCall(
            this.imageServiceDM.deleteImageTag.bind(this.imageServiceDM),
            {
                ofImageTagGroupId: imageTagGroupId,
                id: imageTagId,
            }
        );
        if (deleteImageTagError !== null) {
            this.logger.error("failed to call image_service.updateImageTag()", {
                error: deleteImageTagError,
            });
            throw new ErrorWithHTTPCode(
                "failed to delete image tag",
                getHttpCodeFromGRPCStatus(deleteImageTagError.code)
            );
        }
    }

    public async addImageTypeToImageTagGroup(
        imageTagGroupId: number,
        imageTypeId: number
    ): Promise<void> {
        const { error: addImageTypeToImageTagGroupError } =
            await promisifyGRPCCall(
                this.imageServiceDM.addImageTypeToImageTagGroup.bind(
                    this.imageServiceDM
                ),
                { imageTagGroupId: imageTagGroupId, imageTypeId: imageTypeId }
            );
        if (addImageTypeToImageTagGroupError !== null) {
            this.logger.error(
                "failed to call image_service.addImageTypeToImageTagGroup()",
                { error: addImageTypeToImageTagGroupError }
            );
            throw new ErrorWithHTTPCode(
                "failed to add image type to image tag group",
                getHttpCodeFromGRPCStatus(addImageTypeToImageTagGroupError.code)
            );
        }
    }

    public async removeImageTypeFromImageTagGroup(
        imageTagGroupId: number,
        imageTypeId: number
    ): Promise<void> {
        const { error: removeImageTypeFromImageTagGroupError } =
            await promisifyGRPCCall(
                this.imageServiceDM.removeImageTypeFromImageTagGroup.bind(
                    this.imageServiceDM
                ),
                { imageTagGroupId: imageTagGroupId, imageTypeId: imageTypeId }
            );
        if (removeImageTypeFromImageTagGroupError !== null) {
            this.logger.error(
                "failed to call image_service.removeImageTypeFromImageTagGroup()",
                { error: removeImageTypeFromImageTagGroupError }
            );
            throw new ErrorWithHTTPCode(
                "failed to remove image type from image tag group",
                getHttpCodeFromGRPCStatus(
                    removeImageTypeFromImageTagGroupError.code
                )
            );
        }
    }

    public async getImageTagGroupListOfImageType(imageTypeId: number): Promise<{
        imageTagGroupList: ImageTagGroup[];
        imageTagList: ImageTag[][];
    }> {
        const {
            error: getImageTagGroupListOfImageTypeError,
            response: getImageTagGroupListOfImageTypeResponse,
        } = await promisifyGRPCCall(
            this.imageServiceDM.getImageTagGroupListOfImageType.bind(
                this.imageServiceDM
            ),
            { imageTypeId: imageTypeId }
        );
        if (getImageTagGroupListOfImageTypeError !== null) {
            this.logger.error(
                "failed to call image_service.getImageTagGroupListOfImageType()",
                { error: getImageTagGroupListOfImageTypeError }
            );
            throw new ErrorWithHTTPCode(
                "failed to get image tag group list of image type",
                getHttpCodeFromGRPCStatus(
                    getImageTagGroupListOfImageTypeError.code
                )
            );
        }

        const imageTagGroupList =
            getImageTagGroupListOfImageTypeResponse?.imageTagGroupList?.map(
                ImageTagGroup.fromProto
            ) || [];
        const imageTagList =
            getImageTagGroupListOfImageTypeResponse?.imageTagListOfImageTagGroupList?.map(
                (imageTagList) =>
                    imageTagList.imageTagList?.map(ImageTag.fromProto) || []
            ) || [];

        return { imageTagGroupList, imageTagList };
    }

    public async getImageTagGroupListOfImageTypeList(imageTagIdList: number[]): Promise<
        Array<{
            imageTagGroupList: ImageTagGroup[];
            imageTagList: ImageTag[][];
        }>
    > {
        const {
            error: getImageTagGroupListOfImageTypeListError,
            response: getImageTagGroupListOfImageTypeListResponse
        } = await promisifyGRPCCall(this.imageServiceDM.getImageTagGroupListOfImageTypeList.bind(
            this.imageServiceDM
        ),
            { imageTypeIdList: imageTagIdList }
        );

        if (getImageTagGroupListOfImageTypeListError !== null) {
            this.logger.error(
                "fail to call image_service.getImageTagGroupListOfImageTypeList()",
                { error: getImageTagGroupListOfImageTypeListError }
            );
            throw new ErrorWithHTTPCode(
                "fail to get image tag group list of image type list",
                getHttpCodeFromGRPCStatus(
                    getImageTagGroupListOfImageTypeListError.code
                )
            );
        }

        const imageTagGroupAndTagList: Array<{
            imageTagGroupList: ImageTagGroup[];
            imageTagList: ImageTag[][];
        }> = [];

        if (getImageTagGroupListOfImageTypeListResponse?.imageTagGroupAndTagList !== undefined) {
            for (const imageTagGroupAndTag of getImageTagGroupListOfImageTypeListResponse.imageTagGroupAndTagList) {
                const imageTagGroupList
                    = imageTagGroupAndTag.imageTagGroupList?.map(
                        ImageTagGroup.fromProto
                    ) || [];

                const imageTagListOfImageTagGroupList
                    = imageTagGroupAndTag.imageTagListOfImageTagGroupList?.map(
                        (ImageTagSubList: any) => {
                            if (Object.keys(ImageTagSubList).length === 0) return [];
                            return ImageTagSubList.imageTagList.map(
                                ImageTag.fromProto
                            ) || [];
                        }
                    ) || [];

                imageTagGroupAndTagList.push({
                    imageTagGroupList: imageTagGroupList,
                    imageTagList: imageTagListOfImageTagGroupList
                });
            }
            return imageTagGroupAndTagList;
        }
        return [];
    }
}

injected(ImageTagManagementOperatorImpl, IMAGE_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const IMAGE_TAG_MANAGEMENT_OPERATOR_TOKEN =
    token<ImageTagManagementOperator>("ImageTagManagementOperator");
