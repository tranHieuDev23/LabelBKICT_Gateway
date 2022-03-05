import { Container } from "brandi";
import * as routes from "./routes";
import {
    ERROR_HANDLER_MIDDLEWARE_TOKEN,
    getErrorHandlerMiddleware,
} from "./error_handler_middleware";
import { GATEWAY_HTTP_SERVER_TOKEN, GatewayHTTPServer } from "./server";

export * from "./server";

export function bindToContainer(container: Container): void {
    routes.bindToContainer(container);
    container
        .bind(ERROR_HANDLER_MIDDLEWARE_TOKEN)
        .toInstance(getErrorHandlerMiddleware)
        .inSingletonScope();
    container
        .bind(GATEWAY_HTTP_SERVER_TOKEN)
        .toInstance(GatewayHTTPServer)
        .inSingletonScope();
}
