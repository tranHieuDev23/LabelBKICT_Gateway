import { status } from "@grpc/grpc-js";
import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { EXPORT_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { ExportServiceClient } from "../../proto/gen/ExportService";
import { Export } from "../../proto/gen/Export";
import {
    promisifyGRPCCall,
    ErrorWithHTTPCode,
    getHttpCodeFromGRPCStatus,
    LOGGER_TOKEN,
} from "../../utils";

export interface ExportInfoProvider {
    getExport(exportId: number): Promise<Export | null>;
}

export class ExportInfoProviderImpl implements ExportInfoProvider {
    constructor(
        private readonly exportServiceDM: ExportServiceClient,
        private readonly logger: Logger
    ) {}

    public async getExport(exportId: number): Promise<Export | null> {
        const { error: getExportError, response: getExportResponse } =
            await promisifyGRPCCall(
                this.exportServiceDM.getExport.bind(this.exportServiceDM),
                { id: exportId }
            );
        if (getExportError !== null) {
            if (getExportError.code === status.NOT_FOUND) {
                return null;
            }

            this.logger.error("failed to call export_service.getExport()", {
                error: getExportError,
            });
            throw new ErrorWithHTTPCode(
                "Failed to get export",
                getHttpCodeFromGRPCStatus(getExportError.code)
            );
        }

        if (getExportResponse?.export === undefined) {
            this.logger.error("invalid export_service.getExport() response", {
                exportId,
            });
            throw new ErrorWithHTTPCode(
                "Failed to get export",
                getHttpCodeFromGRPCStatus(httpStatus.INTERNAL_SERVER_ERROR)
            );
        }

        return getExportResponse.export;
    }
}

injected(ExportInfoProviderImpl, EXPORT_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const EXPORT_INFO_PROVIDER_TOKEN =
    token<ExportInfoProvider>("ExportInfoProvider");
