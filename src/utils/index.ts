import { Container } from "brandi";
import { LOGGER_TOKEN, initializeLogger } from "./logging";

export * from "./errors";
export * from "./grpc";
export * from "./logging";
export * from "./sensitive-info";

export function bindToContainer(container: Container): void {
    container
        .bind(LOGGER_TOKEN)
        .toInstance(initializeLogger)
        .inSingletonScope();
}
