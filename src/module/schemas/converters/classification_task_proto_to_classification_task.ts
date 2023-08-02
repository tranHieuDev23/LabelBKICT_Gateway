import { injected, token } from "brandi";
import { Logger } from "winston";
import { _ImageStatus_Values } from "../../../proto/gen/ImageStatus";
import { ErrorWithHTTPCode, LOGGER_TOKEN } from "../../../utils";
import { ClassificationTask, ClassificationTaskImage, ClassificationTaskStatus } from "../classification_task";
import { ClassificationTask as ClassificationTaskProto } from "../../../proto/gen/ClassificationTask";
import { _ClassificationTaskStatus_Values } from "../../../proto/gen/ClassificationTaskStatus";
import httpStatus from "http-status";
import { APPLICATION_CONFIG_TOKEN, ApplicationConfig } from "../../../config";

export interface ClassificationTaskProtoToClassificationTaskConverter {
    convert(classificationTaskProto: ClassificationTaskProto | undefined, thumbnailImageFileName: string): ClassificationTask;
}

export class ClassificationTaskProtoToClassificationTaskConverterImpl implements ClassificationTaskProtoToClassificationTaskConverter {
    constructor(private readonly applicationConfig: ApplicationConfig, private readonly logger: Logger) {}

    public convert(classificationTaskProto: ClassificationTaskProto | undefined, thumbnailImageFileName: string): ClassificationTask {
        return new ClassificationTask(
            classificationTaskProto?.id || 0,
            new ClassificationTaskImage(
                classificationTaskProto?.ofImageId || 0,
                this.getThumbnailImageFileURL(thumbnailImageFileName)
            ),
            +(classificationTaskProto?.ofClassificationTypeId || 0),
            +(classificationTaskProto?.requestTime || 0),
            this.getStatusFromStatusProto(classificationTaskProto?.status)
        );
    }

    private getThumbnailImageFileURL(thumbnailFilename: string): string {
        return `/${this.applicationConfig.thumbnailImageURLPrefix}/${thumbnailFilename}`;
    }

    private getStatusFromStatusProto(
        status: _ClassificationTaskStatus_Values | keyof typeof _ClassificationTaskStatus_Values | undefined
    ): ClassificationTaskStatus {
        switch (status) {
            case _ClassificationTaskStatus_Values.REQUESTED:
            case "REQUESTED":
                return ClassificationTaskStatus.REQUESTED;
            case _ClassificationTaskStatus_Values.DONE:
            case "DONE":
                return ClassificationTaskStatus.DONE;
            default:
                this.logger.error("invalid classification task status", { status });
                throw new ErrorWithHTTPCode(
                    `Invalid classification task status ${status}`,
                    httpStatus.INTERNAL_SERVER_ERROR
                );
        }
    }
}

injected(ClassificationTaskProtoToClassificationTaskConverterImpl, APPLICATION_CONFIG_TOKEN, LOGGER_TOKEN);

export const CLASSIFICATION_TASK_PROTO_TO_CLASSIFICATION_TASK_CONVERTER_TOKEN = token<ClassificationTaskProtoToClassificationTaskConverter>(
    "ClassificationTaskProtoToClassificationTask"
);
