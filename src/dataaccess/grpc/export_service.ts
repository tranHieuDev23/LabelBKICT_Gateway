import { loadPackageDefinition, credentials } from "@grpc/grpc-js";
import { loadSync } from "@grpc/proto-loader";
import { injected, token } from "brandi";
import { ExportServiceConfig, EXPORT_SERVICE_CONFIG_TOKEN } from "../../config";
import { ExportServiceClient } from "../../proto/gen/ExportService";
import { ProtoGrpcType } from "../../proto/gen/export_service";

export function getExportServiceDM(
    ExportServiceConfig: ExportServiceConfig
): ExportServiceClient {
    const ExportServiceProtoGrpc = loadExportServiceProtoGrpc(
        ExportServiceConfig.protoPath
    );
    return new ExportServiceProtoGrpc.ExportService(
        `${ExportServiceConfig.host}:${ExportServiceConfig.port}`,
        credentials.createInsecure()
    );
}

function loadExportServiceProtoGrpc(protoPath: string): ProtoGrpcType {
    const packageDefinition = loadSync(protoPath, {
        keepCase: false,
        enums: String,
        defaults: false,
        oneofs: true,
    });
    const ExportServicePackageDefinition = loadPackageDefinition(
        packageDefinition
    ) as unknown;
    return ExportServicePackageDefinition as ProtoGrpcType;
}

injected(getExportServiceDM, EXPORT_SERVICE_CONFIG_TOKEN);

export const EXPORT_SERVICE_DM_TOKEN = token<ExportServiceClient>(
    "ExportServiceClient"
);
