import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { ApplicationConfig, APPLICATION_CONFIG_TOKEN } from "../../../config";
import { Export as ExportProto } from "../../../proto/gen/Export";
import { _ExportStatus_Values } from "../../../proto/gen/ExportStatus";
import { _ExportType_Values } from "../../../proto/gen/ExportType";
import { ErrorWithHTTPCode, LOGGER_TOKEN } from "../../../utils";
import { Export, ExportStatus, ExportType } from "../export";
import {
    UserIdToUserConverter,
    USER_ID_TO_USER_CONVERTER_TOKEN,
} from "./user_id_to_user";

export interface ExportProtoToExportConverter {
    convert(exportProto: ExportProto | undefined): Promise<Export>;
}

export class ExportProtoToExportConverterImpl
    implements ExportProtoToExportConverter
{
    constructor(
        private readonly userIdToUserConverter: UserIdToUserConverter,
        private readonly applicationConfig: ApplicationConfig,
        private readonly logger: Logger
    ) {}

    public async convert(
        exportProto: ExportProto | undefined
    ): Promise<Export> {
        const requestedByUser = await this.userIdToUserConverter.convert(
            exportProto?.requestedByUserId
        );
        if (requestedByUser === null) {
            throw new ErrorWithHTTPCode(
                "Export has no requester",
                httpStatus.INTERNAL_SERVER_ERROR
            );
        }
        return new Export(
            exportProto?.id || 0,
            requestedByUser,
            this.getTypeFromTypeProto(exportProto?.type),
            +(exportProto?.expireTime || 0),
            this.getStatusFromStatusProto(exportProto?.status),
            +(exportProto?.expireTime || 0),
            this.getExportedFileURL(exportProto?.exportedFileFilename || "")
        );
    }

    private getTypeFromTypeProto(
        status: _ExportType_Values | keyof typeof _ExportType_Values | undefined
    ): ExportType {
        switch (status) {
            case _ExportType_Values.DATASET:
            case "DATASET":
                return ExportType.DATASET;
            case _ExportType_Values.EXCEL:
            case "EXCEL":
                return ExportType.EXCEL;
            default:
                this.logger.error("invalid export status", { status });
                throw new ErrorWithHTTPCode(
                    `Invalid export status ${status}`,
                    httpStatus.INTERNAL_SERVER_ERROR
                );
        }
    }

    private getStatusFromStatusProto(
        status:
            | _ExportStatus_Values
            | keyof typeof _ExportStatus_Values
            | undefined
    ): ExportStatus {
        switch (status) {
            case _ExportStatus_Values.REQUESTED:
            case "REQUESTED":
                return ExportStatus.REQUESTED;
            case _ExportStatus_Values.PROCESSING:
            case "PROCESSING":
                return ExportStatus.PROCESSING;
            case _ExportStatus_Values.DONE:
            case "DONE":
                return ExportStatus.DONE;
            default:
                this.logger.error("invalid export status", { status });
                throw new ErrorWithHTTPCode(
                    `Invalid export status ${status}`,
                    httpStatus.INTERNAL_SERVER_ERROR
                );
        }
    }

    private getExportedFileURL(exportedFileFilename: string): string {
        return `/${this.applicationConfig.exportFileURLPrefix}/${exportedFileFilename}`;
    }
}

injected(
    ExportProtoToExportConverterImpl,
    USER_ID_TO_USER_CONVERTER_TOKEN,
    APPLICATION_CONFIG_TOKEN,
    LOGGER_TOKEN
);

export const EXPORT_PROTO_TO_EXPORT_CONVERTER_TOKEN =
    token<ExportProtoToExportConverter>("ExportProtoToExportConverter");
