import { Container } from "brandi";
import { GATEWAY_HTTP_SERVER_TOKEN, GatewayHTTPServer } from "./server";

export * from "./server";

export function bindToContainer(container: Container): void {
    container
        .bind(GATEWAY_HTTP_SERVER_TOKEN)
        .toInstance(GatewayHTTPServer)
        .inSingletonScope();
}
