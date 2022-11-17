import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { IMAGE_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { Image } from "../../proto/gen/Image";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { ImageTag } from "../../proto/gen/ImageTag";
import { Region } from "../../proto/gen/Region";
import { ErrorWithHTTPCode, getHttpCodeFromGRPCStatus, LOGGER_TOKEN, promisifyGRPCCall } from "../../utils";

export interface ImageInfoProvider {
    getImage(
        imageId: number,
        withImageTag: boolean,
        withRegion: boolean
    ): Promise<{
        image: Image;
        imageTagList: ImageTag[] | undefined;
        regionList: Region[] | undefined;
    }>;
    getImageList(
        imageIdList: number[],
        withImageTag: boolean,
        withRegion: boolean
    ): Promise<{ imageList: Image[]; imageTagList: ImageTag[][] | undefined; regionList: Region[][] | undefined }>;
}

export class ImageInfoProviderImpl implements ImageInfoProvider {
    constructor(private readonly imageServiceDM: ImageServiceClient, private readonly logger: Logger) {}

    public async getImage(
        imageId: number,
        withImageTag: boolean,
        withRegion: boolean
    ): Promise<{
        image: Image;
        imageTagList: ImageTag[] | undefined;
        regionList: Region[] | undefined;
    }> {
        const { error: getImageError, response: getImageResponse } = await promisifyGRPCCall(
            this.imageServiceDM.getImage.bind(this.imageServiceDM),
            { id: imageId, withImageTag, withRegion }
        );
        if (getImageError !== null) {
            this.logger.error("failed to call image_service.getImage()", {
                error: getImageError,
            });
            throw new ErrorWithHTTPCode("Failed to get image", getHttpCodeFromGRPCStatus(getImageError.code));
        }

        if (getImageResponse?.image === undefined) {
            this.logger.error("invalid image_service.getImage() response", {
                error: getImageError,
            });
            throw new ErrorWithHTTPCode(
                "Invalid image_service.getImage() response",
                getHttpCodeFromGRPCStatus(httpStatus.INTERNAL_SERVER_ERROR)
            );
        }

        return {
            image: getImageResponse.image,
            imageTagList: getImageResponse.imageTagList,
            regionList: getImageResponse.regionList,
        };
    }

    public async getImageList(
        imageIdList: number[],
        withImageTag: boolean,
        withRegion: boolean
    ): Promise<{ imageList: Image[]; imageTagList: ImageTag[][] | undefined; regionList: Region[][] | undefined }> {
        const getImageResultList = await Promise.all(
            imageIdList.map((imageId) => this.getImage(imageId, withImageTag, withRegion))
        );
        const imageList = getImageResultList.map((result) => result.image);
        const imageTagList = withImageTag ? getImageResultList.map((result) => result.imageTagList || []) : undefined;
        const regionList = withRegion ? getImageResultList.map((result) => result.regionList || []) : undefined;
        return { imageList, imageTagList, regionList };
    }
}

injected(ImageInfoProviderImpl, IMAGE_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const IMAGE_INFO_PROVIDER_TOKEN = token<ImageInfoProvider>("ImageInfoProvider");
