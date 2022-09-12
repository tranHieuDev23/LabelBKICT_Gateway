import { Readable, Transform } from "stream";
import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { EXPORT_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { ExportServiceClient } from "../../proto/gen/ExportService";
import { _ExportType_Values } from "../../proto/gen/ExportType";
import { GetExportFileResponse } from "../../proto/gen/GetExportFileResponse";
import { AuthenticatedUserInformation } from "../../service/utils";
import { ErrorWithHTTPCode, getHttpCodeFromGRPCStatus, LOGGER_TOKEN, promisifyGRPCCall } from "../../utils";
import { ExportInfoProvider, EXPORT_INFO_PROVIDER_TOKEN } from "../info_providers";
import {
    Export,
    ExportProtoToExportConverter,
    EXPORT_PROTO_TO_EXPORT_CONVERTER_TOKEN,
    ImageListFilterOptions,
} from "../schemas";
import { UserManageableImageFilterOptionsProvider, USER_MANAGEABLE_IMAGE_FILTER_OPTIONS_PROVIDER } from "../images";

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
    getExportFile(
        authenticatedUserInfo: AuthenticatedUserInformation,
        id: number
    ): Promise<{
        export: Export;
        exportFileStream: Readable;
    }>;
    deleteExport(authenticatedUserInfo: AuthenticatedUserInformation, id: number): Promise<void>;
}

export class ExportManagementOperatorImpl implements ExportManagementOperator {
    constructor(
        private readonly exportServiceDM: ExportServiceClient,
        private readonly exportInfoProvider: ExportInfoProvider,
        private readonly exportProtoToExportConverter: ExportProtoToExportConverter,
        private readonly userManageableImageFilterOptionsProvider: UserManageableImageFilterOptionsProvider,
        private readonly logger: Logger
    ) {}

    public async createExport(
        authenticatedUserInfo: AuthenticatedUserInformation,
        type: _ExportType_Values,
        filterOptions: ImageListFilterOptions
    ): Promise<Export> {
        const filterOptionsProto =
            await this.userManageableImageFilterOptionsProvider.getUserManageableImageFilterOptionsProto(
                authenticatedUserInfo,
                filterOptions
            );
        const { error: createExportError, response: createExportResponse } = await promisifyGRPCCall(
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
        return await this.exportProtoToExportConverter.convert(createExportResponse?.export);
    }

    public async getExportList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number
    ): Promise<{ totalExportCount: number; exportList: Export[] }> {
        const { error: getExportListError, response: getExportListResponse } = await promisifyGRPCCall(
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
            exportProtoList.map((exportProto) => this.exportProtoToExportConverter.convert(exportProto))
        );

        return { totalExportCount, exportList };
    }

    public async getExportFile(
        authenticatedUserInfo: AuthenticatedUserInformation,
        id: number
    ): Promise<{
        export: Export;
        exportFileStream: Readable;
    }> {
        const exportProto = await this.exportInfoProvider.getExport(id);
        if (exportProto === null) {
            this.logger.error("no export with export_id found", {
                exportId: id,
            });
            throw new ErrorWithHTTPCode("Failed to get export file", httpStatus.NOT_FOUND);
        }

        if (exportProto.requestedByUserId !== authenticatedUserInfo.user.id) {
            this.logger.error("user is not allowed to access export", {
                userId: authenticatedUserInfo.user.id,
                exportId: id,
            });
            throw new ErrorWithHTTPCode("Failed to get export file", httpStatus.FORBIDDEN);
        }

        const exportRequest = await this.exportProtoToExportConverter.convert(exportProto);

        const getExportFileResponseStream = this.exportServiceDM.getExportFile({
            id,
        });
        const exportFileStream = getExportFileResponseStream.pipe(
            new Transform({
                readableObjectMode: true,
                writableObjectMode: true,
                transform: (chunk: GetExportFileResponse, _, callback) => {
                    callback(null, Buffer.from(chunk?.data || ""));
                },
            })
        );

        return { export: exportRequest, exportFileStream };
    }

    public async deleteExport(authenticatedUserInfo: AuthenticatedUserInformation, id: number): Promise<void> {
        const exportRequest = await this.exportInfoProvider.getExport(id);
        if (exportRequest === null) {
            this.logger.error("no export with export_id found", {
                exportId: id,
            });
            throw new ErrorWithHTTPCode("Failed to delete export", httpStatus.NOT_FOUND);
        }

        if (exportRequest.requestedByUserId !== authenticatedUserInfo.user.id) {
            this.logger.error("user is not allowed to access export", {
                userId: authenticatedUserInfo.user.id,
                exportId: id,
            });
            throw new ErrorWithHTTPCode("Failed to delete export", httpStatus.FORBIDDEN);
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
    EXPORT_PROTO_TO_EXPORT_CONVERTER_TOKEN,
    USER_MANAGEABLE_IMAGE_FILTER_OPTIONS_PROVIDER,
    LOGGER_TOKEN
);

export const EXPORT_MANAGEMENT_OPERATOR_TOKEN = token<ExportManagementOperator>("ExportManagementOperator");
