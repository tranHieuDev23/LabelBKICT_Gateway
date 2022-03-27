import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { RegionOperationLog as RegionOperationLogProto } from "../../../proto/gen/RegionOperationLog";
import { RegionOperationLogDrawMetadata as RegionOperationLogDrawMetadataProto } from "../../../proto/gen/RegionOperationLogDrawMetadata";
import { RegionOperationLogLabelMetadata as RegionOperationLogLabelMetadataProto } from "../../../proto/gen/RegionOperationLogLabelMetadata";
import { _RegionOperationType_Values } from "../../../proto/gen/RegionOperationType";
import { ErrorWithHTTPCode, LOGGER_TOKEN } from "../../../utils";
import { Polygon } from "../polygon";
import { RegionLabel } from "../region_label";
import {
    OperationType,
    RegionOperationLog,
    RegionOperationLogDrawMetadata,
    RegionOperationLogLabelMetadata,
} from "../region_operator_log";
import {
    UserIdToUserConverter,
    USER_ID_TO_USER_CONVERTER_TOKEN,
} from "./user_id_to_user";

export interface RegionOperationLogProtoToRegionOperationLogConverter {
    convert(log: RegionOperationLogProto): Promise<RegionOperationLog>;
}

export class RegionOperationLogProtoToRegionOperationLogConverterImpl
    implements RegionOperationLogProtoToRegionOperationLogConverter
{
    constructor(
        private readonly userIdToUserConverter: UserIdToUserConverter,
        private readonly logger: Logger
    ) {}

    public async convert(
        log: RegionOperationLogProto
    ): Promise<RegionOperationLog> {
        const id = log.id || 0;
        const user = await this.userIdToUserConverter.convert(log.byUserId);
        const operationTime = +(log.operationTime || 0);
        const operationType =
            this.getRegionOperationTypeFromRegionOperationTypeProto(
                log.operationType
            );

        const operationMetadata =
            operationType === OperationType.DRAW
                ? this.getRegionOperationLogDrawMetadataFromProto(
                      log.drawMetadata
                  )
                : this.getRegionOperationLogLabelMetadataFromProto(
                      log.labelMetadata
                  );

        return new RegionOperationLog(
            id,
            user,
            operationTime,
            operationType,
            operationMetadata
        );
    }

    private getRegionOperationTypeFromRegionOperationTypeProto(
        operationType:
            | _RegionOperationType_Values
            | keyof typeof _RegionOperationType_Values
            | undefined
    ): OperationType {
        switch (operationType) {
            case _RegionOperationType_Values.DRAW:
            case "DRAW":
                return OperationType.DRAW;
            case _RegionOperationType_Values.LABEL:
            case "LABEL":
                return OperationType.LABEL;
            default:
                this.logger.error("invalid operation type value", {
                    operationType,
                });
                throw new ErrorWithHTTPCode(
                    "invalid operation type value",
                    httpStatus.INTERNAL_SERVER_ERROR
                );
        }
    }

    private getRegionOperationLogDrawMetadataFromProto(
        metadataProto: RegionOperationLogDrawMetadataProto | null | undefined
    ): RegionOperationLogDrawMetadata {
        const oldBorder = metadataProto?.oldBorder
            ? Polygon.fromProto(metadataProto?.oldBorder)
            : null;
        const oldHoles = metadataProto?.oldHoles
            ? metadataProto.oldHoles.map(Polygon.fromProto)
            : null;
        if (!metadataProto?.newBorder) {
            this.logger.error("invalid new_border value for operation log");
            throw new ErrorWithHTTPCode(
                "invalid new_border value for operation log",
                httpStatus.INTERNAL_SERVER_ERROR
            );
        }
        const newBorder = Polygon.fromProto(metadataProto?.newBorder);
        const newHoles = (metadataProto?.newHoles || []).map(Polygon.fromProto);
        return new RegionOperationLogDrawMetadata(
            oldBorder,
            oldHoles,
            newBorder,
            newHoles
        );
    }

    private getRegionOperationLogLabelMetadataFromProto(
        metadataProto: RegionOperationLogLabelMetadataProto | null | undefined
    ): RegionOperationLogLabelMetadata {
        const oldRegionLabel = metadataProto?.oldRegionLabel
            ? RegionLabel.fromProto(metadataProto?.oldRegionLabel)
            : null;
        const newRegionLabel = metadataProto?.newRegionLabel
            ? RegionLabel.fromProto(metadataProto?.newRegionLabel)
            : null;
        return new RegionOperationLogLabelMetadata(
            oldRegionLabel,
            newRegionLabel
        );
    }
}

injected(
    RegionOperationLogProtoToRegionOperationLogConverterImpl,
    USER_ID_TO_USER_CONVERTER_TOKEN,
    LOGGER_TOKEN
);

export const REGION_OPERATION_LOG_PROTO_TO_REGION_OPERATION_LOG_CONVERTER_TOKEN =
    token<RegionOperationLogProtoToRegionOperationLogConverter>(
        "RegionOperationLogProtoToRegionOperationLogConverter"
    );
