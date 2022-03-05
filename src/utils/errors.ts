import { status } from "@grpc/grpc-js";
import httpStatus from "http-status";

export class ErrorWithHTTPCode extends Error {
    constructor(public readonly message: string, public readonly code: number) {
        super(message);
    }

    public static wrapWithStatus(e: any, code: number): ErrorWithHTTPCode {
        if (e instanceof Error) {
            return new ErrorWithHTTPCode(e.message, code);
        }
        return new ErrorWithHTTPCode(JSON.stringify(e), code);
    }
}

const GRPC_STATUS_TO_HTTP_CODE = new Map<status, number>([
    [status.ALREADY_EXISTS, httpStatus.CONFLICT],
    [status.INTERNAL, httpStatus.INTERNAL_SERVER_ERROR],
    [status.INVALID_ARGUMENT, httpStatus.BAD_REQUEST],
    [status.NOT_FOUND, httpStatus.NOT_FOUND],
    [status.OK, httpStatus.OK],
    [status.PERMISSION_DENIED, httpStatus.FORBIDDEN],
    [status.UNAUTHENTICATED, httpStatus.UNAUTHORIZED],
]);

export function getHttpCodeFromGRPCStatus(grpcStatus: status): number {
    return (
        GRPC_STATUS_TO_HTTP_CODE.get(grpcStatus) ||
        httpStatus.INTERNAL_SERVER_ERROR
    );
}
