import { Container } from "brandi";
import { GATEWAY_HTTP_SERVER_TOKEN, getGatewayHTTPServer } from "./server";

export * from "./server";

export function bindToContainer(container: Container): void {
    container
        .bind(GATEWAY_HTTP_SERVER_TOKEN)
        .toInstance(getGatewayHTTPServer)
        .inSingletonScope();
}
