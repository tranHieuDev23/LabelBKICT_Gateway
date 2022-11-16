import { RequestHandler } from "express";
import asyncHandler from "express-async-handler";
import { Client } from "minio";
import { Logger } from "winston";
import { basename } from "path";
import { BucketDMImpl } from "../../dataaccess/s3";
import { injected, token } from "brandi";
import { MINIO_CLIENT_TOKEN } from "../../dataaccess/s3/minio";
import { LOGGER_TOKEN } from "../../utils";

export interface S3MiddlewareFactory {
    getS3Middleware(bucketName: string): RequestHandler;
}

export class MinioMiddlewareFactoryImpl implements S3MiddlewareFactory {
    constructor(private readonly minioClient: Client, private readonly logger: Logger) {}

    public getS3Middleware(bucketName: string): RequestHandler {
        const bucketDM = new BucketDMImpl(bucketName, this.minioClient, this.logger);
        return asyncHandler(async (request, response) => {
            const fileName = basename(request.path);
            const objectStream = await bucketDM.getFileStream(fileName);
            console.log(objectStream);
            objectStream.pipe(response);
        });
    }
}

injected(MinioMiddlewareFactoryImpl, MINIO_CLIENT_TOKEN, LOGGER_TOKEN);

export const MINIO_MIDDLEWARE_FACTORY_TOKEN = token<S3MiddlewareFactory>("MinioMiddlewareFactory");
