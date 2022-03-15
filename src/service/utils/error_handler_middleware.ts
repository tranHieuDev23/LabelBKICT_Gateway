import { injected, token } from "brandi";
import { ErrorRequestHandler } from "express";
import httpStatus from "http-status";
import { Logger } from "winston";
import {
    ErrorWithHTTPCode,
    LOGGER_TOKEN,
    maskSensitiveFields,
} from "../../utils";
import { error as OpenAPIError } from "express-openapi-validator";

export function getErrorHandlerMiddleware(logger: Logger): ErrorRequestHandler {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (error, request, response, _) => {
        logger.error("failed to handle request", {
            method: request.method,
            path: request.originalUrl,
            body: maskSensitiveFields(request.body),
            error: error,
        });

        if (error instanceof ErrorWithHTTPCode) {
            response.status(error.code).json({ message: error.message });
        } else if (error instanceof OpenAPIError.BadRequest) {
            response
                .status(httpStatus.BAD_REQUEST)
                .json({ message: "Bad request" });
        } else if (error instanceof OpenAPIError.Unauthorized) {
            response
                .status(httpStatus.UNAUTHORIZED)
                .json({ message: "Unauthorized" });
        } else if (error instanceof OpenAPIError.NotFound) {
            response
                .status(httpStatus.NOT_FOUND)
                .json({ message: "Not found" });
        } else {
            response
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: "Internal Server Error" });
        }
    };
}

injected(getErrorHandlerMiddleware, LOGGER_TOKEN);

export const ERROR_HANDLER_MIDDLEWARE_TOKEN = token<ErrorRequestHandler>(
    "ErrorHandlerMiddleware"
);
