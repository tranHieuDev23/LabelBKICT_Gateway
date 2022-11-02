import { Client } from "minio";
import { Logger } from "winston";
import { Readable } from "stream";
import { ErrorWithHTTPCode } from "../../utils";
import httpStatus from "http-status";

export interface BucketDM {
    createBucketIfNotExist(): Promise<void>;
    uploadFile(fileName: string, fileData: Buffer): Promise<void>;
    getFileStream(fileName: string): Promise<Readable>;
    getFile(fileName: string): Promise<Buffer>;
    deleteFile(fileName: string): Promise<void>;
}

export class BucketDMImpl implements BucketDM {
    constructor(
        private readonly bucketName: string,
        private readonly minioClient: Client,
        private readonly logger: Logger
    ) {}

    public async createBucketIfNotExist(): Promise<void> {
        try {
            if (await this.minioClient.bucketExists(this.bucketName)) {
                return;
            }
        } catch (error) {
            this.logger.error("failed to check bucket's existence", { bucketName: this.bucketName, error });
            throw new ErrorWithHTTPCode("failed to check bucket's existence", httpStatus.INTERNAL_SERVER_ERROR);
        }

        try {
            await this.minioClient.makeBucket(this.bucketName, "");
        } catch (error) {
            this.logger.error("failed to create bucket", { bucketName: this.bucketName, error });
            throw new ErrorWithHTTPCode("failed to create bucket", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async uploadFile(fileName: string, fileData: Buffer): Promise<void> {
        try {
            await this.minioClient.putObject(this.bucketName, fileName, fileData);
        } catch (error) {
            this.logger.error("failed to upload file", { bucketName: this.bucketName, fileName: fileName, error });
            throw new ErrorWithHTTPCode("failed to upload file", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async getFile(fileName: string): Promise<Buffer> {
        try {
            const objectStream = await this.minioClient.getObject(this.bucketName, fileName);
            const bufferArray = [];
            for await (const data of objectStream) {
                bufferArray.push(data);
            }
            return Buffer.concat(bufferArray);
        } catch (error) {
            this.logger.error("failed to get file", { bucketName: this.bucketName, fileName: fileName, error });
            throw new ErrorWithHTTPCode("failed to get file", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async getFileStream(fileName: string): Promise<Readable> {
        try {
            return this.minioClient.getObject(this.bucketName, fileName);
        } catch (error) {
            this.logger.error("failed to get file stream", { bucketName: this.bucketName, fileName: fileName, error });
            throw new ErrorWithHTTPCode("failed to get file stream", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async deleteFile(fileName: string): Promise<void> {
        try {
            await this.minioClient.removeObject(this.bucketName, fileName);
        } catch (error) {
            this.logger.error("failed to delete file", { bucketName: this.bucketName, fileName: fileName, error });
            throw new ErrorWithHTTPCode("failed to delete file", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
