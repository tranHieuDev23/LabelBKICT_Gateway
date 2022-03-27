import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { ApplicationConfig, APPLICATION_CONFIG_TOKEN } from "../../../config";
import { Image as ImageProto } from "../../../proto/gen/Image";
import { _ImageStatus_Values } from "../../../proto/gen/ImageStatus";
import { ErrorWithHTTPCode, LOGGER_TOKEN } from "../../../utils";
import { Image, ImageStatus } from "../image";
import { ImageType } from "../image_type";
import {
    UserIdToUserConverter,
    USER_ID_TO_USER_CONVERTER_TOKEN,
} from "./user_id_to_user";

export interface ImageProtoToImageConverter {
    convert(imageProto: ImageProto | undefined): Promise<Image>;
}

export class ImageProtoToImageConverterImpl
    implements ImageProtoToImageConverter
{
    constructor(
        private readonly userIdToUserConverter: UserIdToUserConverter,
        private readonly applicationConfig: ApplicationConfig,
        private readonly logger: Logger
    ) {}

    public async convert(imageProto: ImageProto | undefined): Promise<Image> {
        const imageId = imageProto?.id || 0;
        const uploadedByUser = await this.userIdToUserConverter.convert(
            imageProto?.uploadedByUserId
        );
        if (uploadedByUser === null) {
            throw new ErrorWithHTTPCode(
                "image has no uploader",
                httpStatus.INTERNAL_SERVER_ERROR
            );
        }
        const uploadTime = +(imageProto?.uploadTime || 0);
        const publishedByUser = await this.userIdToUserConverter.convert(
            imageProto?.publishedByUserId
        );
        const publishTime = +(imageProto?.publishTime || 0);
        const verifiedByUser = await this.userIdToUserConverter.convert(
            imageProto?.verifiedByUserId
        );
        const verifyTime = +(imageProto?.verifyTime || 0);
        const originalFileName = imageProto?.originalFileName || "";
        const originalImageFileURL = this.getOriginalImageFileURL(
            imageProto?.originalImageFilename || ""
        );
        const thumbnailImageFileURL = this.getThumbnailImageFileURL(
            imageProto?.thumbnailImageFilename || ""
        );
        const description = imageProto?.description || "";
        const imageType = imageProto?.imageType
            ? ImageType.fromProto(imageProto.imageType)
            : null;
        const imageStatus = this.getStatusFromStatusProto(imageProto?.status);

        return new Image(
            imageId,
            uploadedByUser,
            uploadTime,
            publishedByUser,
            publishTime,
            verifiedByUser,
            verifyTime,
            originalFileName,
            originalImageFileURL,
            thumbnailImageFileURL,
            description,
            imageType,
            imageStatus
        );
    }

    private getOriginalImageFileURL(originalImageFilename: string): string {
        return `/${this.applicationConfig.originalImageURLPrefix}/${originalImageFilename}`;
    }

    private getThumbnailImageFileURL(thumbnailFilename: string): string {
        return `/${this.applicationConfig.thumbnailImageURLPrefix}/${thumbnailFilename}`;
    }

    private getStatusFromStatusProto(
        status:
            | _ImageStatus_Values
            | keyof typeof _ImageStatus_Values
            | undefined
    ): ImageStatus {
        switch (status) {
            case _ImageStatus_Values.UPLOADED:
            case "UPLOADED":
                return ImageStatus.UPLOADED;
            case _ImageStatus_Values.PUBLISHED:
            case "PUBLISHED":
                return ImageStatus.PUBLISHED;
            case _ImageStatus_Values.VERIFIED:
            case "VERIFIED":
                return ImageStatus.VERIFIED;
            case _ImageStatus_Values.EXCLUDED:
            case "EXCLUDED":
                return ImageStatus.EXCLUDED;
            default:
                this.logger.error("invalid image status", { status });
                throw new ErrorWithHTTPCode(
                    `Invalid image status ${status}`,
                    httpStatus.INTERNAL_SERVER_ERROR
                );
        }
    }
}

injected(
    ImageProtoToImageConverterImpl,
    USER_ID_TO_USER_CONVERTER_TOKEN,
    APPLICATION_CONFIG_TOKEN,
    LOGGER_TOKEN
);

export const IMAGE_PROTO_TO_IMAGE_CONVERTER_TOKEN =
    token<ImageProtoToImageConverter>("ImageProtoToImageConverter");
