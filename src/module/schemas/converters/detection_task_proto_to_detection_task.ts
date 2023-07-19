import { injected, token } from "brandi";
import { Logger } from "winston";
import { _ImageStatus_Values } from "../../../proto/gen/ImageStatus";
import { ErrorWithHTTPCode, LOGGER_TOKEN } from "../../../utils";
import { Image } from "../image";
import { DetectionTask, DetectionTaskStatus } from "../detection_task";
import { DetectionTask as DetectionTaskProto } from "../../../proto/gen/DetectionTask";
import { _DetectionTaskStatus_Values } from "../../../proto/gen/DetectionTaskStatus";
import httpStatus from "http-status";

export interface DetectionTaskProtoToDetectionTaskConverter {
    convert(detectionTaskProto: DetectionTaskProto | undefined, image: Image): DetectionTask;
}

export class DetectionTaskProtoToDetectionTaskConverterImpl implements DetectionTaskProtoToDetectionTaskConverter {
    constructor(private readonly logger: Logger) {}

    public convert(detectionTaskProto: DetectionTaskProto | undefined, image: Image): DetectionTask {
        return new DetectionTask(
            detectionTaskProto?.id || 0,
            image,
            +(detectionTaskProto?.requestTime || 0),
            this.getStatusFromStatusProto(detectionTaskProto?.status),
            +(detectionTaskProto?.updateTime || 0)
        );
    }

    private getStatusFromStatusProto(
        status: _DetectionTaskStatus_Values | keyof typeof _DetectionTaskStatus_Values | undefined
    ): DetectionTaskStatus {
        switch (status) {
            case _DetectionTaskStatus_Values.REQUESTED:
            case "REQUESTED":
                return DetectionTaskStatus.REQUESTED;
            case _DetectionTaskStatus_Values.PROCESSING:
            case "PROCESSING":
                return DetectionTaskStatus.PROCESSING;
            case _DetectionTaskStatus_Values.DONE:
            case "DONE":
                return DetectionTaskStatus.DONE;
            default:
                this.logger.error("invalid detection task status", { status });
                throw new ErrorWithHTTPCode(
                    `Invalid detection task status ${status}`,
                    httpStatus.INTERNAL_SERVER_ERROR
                );
        }
    }
}

injected(DetectionTaskProtoToDetectionTaskConverterImpl, LOGGER_TOKEN);

export const DETECTION_TASK_PROTO_TO_DETECTION_TASK_CONVERTER_TOKEN = token<DetectionTaskProtoToDetectionTaskConverter>(
    "DetectionTaskProtoToDetectionTask"
);
