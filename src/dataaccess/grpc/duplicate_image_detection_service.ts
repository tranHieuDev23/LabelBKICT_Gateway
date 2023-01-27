import { loadPackageDefinition, credentials } from "@grpc/grpc-js";
import { loadSync } from "@grpc/proto-loader";
import { injected, token } from "brandi";
import { DuplicateImageDetectionServiceConfig, DUPLICATE_IMAGE_DETECTION_SERVICE_CONFIG_TOKEN } from "../../config";
import { DuplicateImageDetectionServiceClient } from "../../proto/gen/DuplicateImageDetectionService";
import { ProtoGrpcType } from "../../proto/gen/duplicate_image_detection_service";

export function getDuplicateImageDetectionServiceDM(
    DuplicateImageDetectionServiceConfig: DuplicateImageDetectionServiceConfig
): DuplicateImageDetectionServiceClient {
    const DuplicateImageDetectionServiceProtoGrpc = loadDuplicateImageDetectionServiceProtoGrpc(
        DuplicateImageDetectionServiceConfig.protoPath
    );
    return new DuplicateImageDetectionServiceProtoGrpc.DuplicateImageDetectionService(
        `${DuplicateImageDetectionServiceConfig.host}:${DuplicateImageDetectionServiceConfig.port}`,
        credentials.createInsecure()
    );
}

function loadDuplicateImageDetectionServiceProtoGrpc(protoPath: string): ProtoGrpcType {
    const packageDefinition = loadSync(protoPath, {
        keepCase: false,
        enums: String,
        defaults: false,
        oneofs: true,
    });
    const DuplicateImageDetectionServicePackageDefinition = loadPackageDefinition(
        packageDefinition
    ) as unknown;
    return DuplicateImageDetectionServicePackageDefinition as ProtoGrpcType;
}

injected(getDuplicateImageDetectionServiceDM, DUPLICATE_IMAGE_DETECTION_SERVICE_CONFIG_TOKEN);

export const DUPLICATE_IMAGE_DETECTION_SERVICE_DM_TOKEN =
    token<DuplicateImageDetectionServiceClient>("DuplicateImageDetectionServiceClient");
