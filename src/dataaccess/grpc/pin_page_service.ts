import { loadPackageDefinition, credentials } from "@grpc/grpc-js";
import { loadSync } from "@grpc/proto-loader";
import { injected, token } from "brandi";
import {
    PinPageServiceConfig,
    PIN_PAGE_SERVICE_CONFIG_TOKEN,
} from "../../config";
import { PinPageServiceClient } from "../../proto/gen/PinPageService";
import { ProtoGrpcType } from "../../proto/gen/pin_page_service";

export function getPinPageServiceDM(
    PinPageServiceConfig: PinPageServiceConfig
): PinPageServiceClient {
    const PinPageServiceProtoGrpc = loadPinPageServiceProtoGrpc(
        PinPageServiceConfig.protoPath
    );
    return new PinPageServiceProtoGrpc.PinPageService(
        `${PinPageServiceConfig.host}:${PinPageServiceConfig.port}`,
        credentials.createInsecure()
    );
}

function loadPinPageServiceProtoGrpc(protoPath: string): ProtoGrpcType {
    const packageDefinition = loadSync(protoPath, {
        keepCase: false,
        enums: String,
        defaults: false,
        oneofs: true,
    });
    const PinPageServicePackageDefinition = loadPackageDefinition(
        packageDefinition
    ) as unknown;
    return PinPageServicePackageDefinition as ProtoGrpcType;
}

injected(getPinPageServiceDM, PIN_PAGE_SERVICE_CONFIG_TOKEN);

export const PIN_PAGE_SERVICE_DM_TOKEN = token<PinPageServiceClient>(
    "PinPageServiceClient"
);
