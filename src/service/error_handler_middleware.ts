import { injected, token } from "brandi";
import { ErrorRequestHandler } from "express";
import httpStatus from "http-status";
import { Logger } from "winston";
import { ErrorWithHTTPCode, LOGGER_TOKEN } from "../utils";

export function getErrorHandlerMiddleware(logger: Logger): ErrorRequestHandler {
    return (error, request, response, _) => {
        logger.error(
            "failed to handle request",
            { path: request.originalUrl },
            { body: request.body }
        );

        if (error instanceof ErrorWithHTTPCode) {
            response.status(error.code).json({ message: error.message });
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
