import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { EXPORT_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { ExportServiceClient } from "../../proto/gen/ExportService";
import { _ExportType_Values } from "../../proto/gen/ExportType";
import { AuthenticatedUserInformation } from "../../service/utils";
import {
    ErrorWithHTTPCode,
    getHttpCodeFromGRPCStatus,
    LOGGER_TOKEN,
    promisifyGRPCCall,
} from "../../utils";
import {
    ExportInfoProvider,
    EXPORT_INFO_PROVIDER_TOKEN,
} from "../info_providers";
import {
    Export,
    FilterOptionsToFilterOptionsProtoConverter,
    FILTER_OPTIONS_TO_FILTER_OPTIONS_PROTO_CONVERTER,
    ExportProtoToExportConverter,
    EXPORT_PROTO_TO_EXPORT_CONVERTER_TOKEN,
    ImageListFilterOptions,
} from "../schemas";

export interface ExportManagementOperator {
    createExport(
        authenticatedUserInfo: AuthenticatedUserInformation,
        type: _ExportType_Values,
        filterOptions: ImageListFilterOptions
    ): Promise<Export>;
    getExportList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number
    ): Promise<{
        totalExportCount: number;
        exportList: Export[];
    }>;
    deleteExport(
        authenticatedUserInfo: AuthenticatedUserInformation,
        id: number
    ): Promise<void>;
}

export class ExportManagementOperatorImpl implements ExportManagementOperator {
    constructor(
        private readonly exportServiceDM: ExportServiceClient,
        private readonly exportInfoProvider: ExportInfoProvider,
        private readonly filterOptionsToFilterOptionsProto: FilterOptionsToFilterOptionsProtoConverter,
        private readonly exportProtoToExportConverter: ExportProtoToExportConverter,
        private readonly logger: Logger
    ) {}

    public async createExport(
        authenticatedUserInfo: AuthenticatedUserInformation,
        type: _ExportType_Values,
        filterOptions: ImageListFilterOptions
    ): Promise<Export> {
        const filterOptionsProto =
            this.filterOptionsToFilterOptionsProto.convert(filterOptions);
        const { error: createExportError, response: createExportResponse } =
            await promisifyGRPCCall(
                this.exportServiceDM.createExport.bind(this.exportServiceDM),
                {
                    requestedByUserId: authenticatedUserInfo.user.id,
                    type,
                    filterOptions: filterOptionsProto,
                }
            );
        if (createExportError !== null) {
            this.logger.error("failed to call export_service.createExport()", {
                error: createExportError,
            });
            throw ErrorWithHTTPCode.wrapWithStatus(
                createExportError,
                getHttpCodeFromGRPCStatus(createExportError.code)
            );
        }
        return await this.exportProtoToExportConverter.convert(
            createExportResponse?.export
        );
    }

    public async getExportList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number
    ): Promise<{ totalExportCount: number; exportList: Export[] }> {
        const { error: getExportListError, response: getExportListResponse } =
            await promisifyGRPCCall(
                this.exportServiceDM.getExportList.bind(this.exportServiceDM),
                {
                    requestedByUserId: authenticatedUserInfo.user.id,
                    offset,
                    limit,
                }
            );
        if (getExportListError !== null) {
            this.logger.error("failed to call export_service.getExportList()", {
                error: getExportListError,
            });
            throw ErrorWithHTTPCode.wrapWithStatus(
                getExportListError,
                getHttpCodeFromGRPCStatus(getExportListError.code)
            );
        }

        const totalExportCount = getExportListResponse?.totalExportCount || 0;
        const exportProtoList = getExportListResponse?.exportList || [];
        const exportList = await Promise.all(
            exportProtoList.map((exportProto) =>
                this.exportProtoToExportConverter.convert(exportProto)
            )
        );

        return { totalExportCount, exportList };
    }

    public async deleteExport(
        authenticatedUserInfo: AuthenticatedUserInformation,
        id: number
    ): Promise<void> {
        const exportRequest = await this.exportInfoProvider.getExport(id);
        if (exportRequest === null) {
            this.logger.error("no export with export_id found", {
                exportId: id,
            });
            throw new ErrorWithHTTPCode(
                `no export with export_id ${id} found`,
                httpStatus.NOT_FOUND
            );
        }

        const { error: deleteExportError } = await promisifyGRPCCall(
            this.exportServiceDM.deleteExport.bind(this.exportServiceDM),
            { id }
        );
        if (deleteExportError !== null) {
            this.logger.error("failed to call export_service.deleteExport()", {
                error: deleteExportError,
            });
            throw ErrorWithHTTPCode.wrapWithStatus(
                deleteExportError,
                getHttpCodeFromGRPCStatus(deleteExportError.code)
            );
        }
    }
}

injected(
    ExportManagementOperatorImpl,
    EXPORT_SERVICE_DM_TOKEN,
    EXPORT_INFO_PROVIDER_TOKEN,
    FILTER_OPTIONS_TO_FILTER_OPTIONS_PROTO_CONVERTER,
    EXPORT_PROTO_TO_EXPORT_CONVERTER_TOKEN,
    LOGGER_TOKEN
);

export const EXPORT_MANAGEMENT_OPERATOR_TOKEN = token<ExportManagementOperator>(
    "ExportManagementOperator"
);
