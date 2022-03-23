import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { _ImageStatus_Values } from "../../../proto/gen/ImageStatus";
import { ErrorWithHTTPCode, LOGGER_TOKEN } from "../../../utils";
import { ImageStatus } from "../image";

export interface ImageStatusToImageStatusProtoConverter {
    convert(status: ImageStatus): _ImageStatus_Values;
}

export class ImageStatusToImageStatusProtoConverterImpl
    implements ImageStatusToImageStatusProtoConverter
{
    constructor(private readonly logger: Logger) {}

    public convert(status: ImageStatus): _ImageStatus_Values {
        switch (status) {
            case ImageStatus.UPLOADED:
                return _ImageStatus_Values.UPLOADED;
            case ImageStatus.PUBLISHED:
                return _ImageStatus_Values.PUBLISHED;
            case ImageStatus.VERIFIED:
                return _ImageStatus_Values.VERIFIED;
            case ImageStatus.EXCLUDED:
                return _ImageStatus_Values.EXCLUDED;
            default:
                this.logger.error("invalid image status", { status });
                throw new ErrorWithHTTPCode(
                    `Invalid image status ${status}`,
                    httpStatus.BAD_REQUEST
                );
        }
    }
}

injected(ImageStatusToImageStatusProtoConverterImpl, LOGGER_TOKEN);

export const IMAGE_STATUS_TO_IMAGE_STATUS_PROTO_CONVERTER_TOKEN =
    token<ImageStatusToImageStatusProtoConverter>(
        "ImageStatusToImageStatusProtoConverter"
    );
