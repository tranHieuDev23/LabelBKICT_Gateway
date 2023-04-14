import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { ClassificationType } from "../classification_type";
import { ErrorWithHTTPCode, LOGGER_TOKEN } from "../../../utils";
import { ImageStatus } from "../image";
import { _ClassificationType_Values } from "../../../proto/gen/ClassificationType";

export interface ClassificationTypeToClassificationTypeProtoConverter {
    convert(classificationType: ClassificationType): _ClassificationType_Values;
}

export class ClassificationTypeToClassificationTypeProtoConverterImpl
    implements ClassificationTypeToClassificationTypeProtoConverter
{
    constructor(private readonly logger: Logger) {}

    public convert(classificationType: ClassificationType): _ClassificationType_Values {
        switch (classificationType) {
            case ClassificationType.ANATOMICAL_SITE:
                return _ClassificationType_Values.ANATOMICAL_SITE;
            case ClassificationType.LESION_TYPE:
                return _ClassificationType_Values.LESION_TYPE;
            case ClassificationType.HP:
                return _ClassificationType_Values.HP;
            default:
                this.logger.error("invalid classification type", { classificationType });
                throw new ErrorWithHTTPCode(
                    `Invalid classification type ${classificationType}`,
                    httpStatus.BAD_REQUEST
                );
        }
    }
}

injected(ClassificationTypeToClassificationTypeProtoConverterImpl, LOGGER_TOKEN);

export const CLASSIFICATION_TYPE_TO_CLASSIFICATION_TYPE_PROTO_CONVERTER_TOKEN =
    token<ClassificationTypeToClassificationTypeProtoConverter>(
        "ClassificationTypeToClassificationTypeProtoConverter"
    );
