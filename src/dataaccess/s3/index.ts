import { Container } from "brandi";
import { MINIO_CLIENT_TOKEN, newMinioClient } from "./minio";

export * from "./bucket_dm";

export function bindToContainer(container: Container): void {
    container.bind(MINIO_CLIENT_TOKEN).toInstance(newMinioClient).inSingletonScope();
}
