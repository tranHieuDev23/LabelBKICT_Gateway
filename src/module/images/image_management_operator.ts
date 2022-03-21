import { ImageStatus } from "../../proto/gen/ImageStatus";
import { AuthenticatedUserInformation } from "../../service/utils";
import { Image, ImageTag, Region } from "../schemas";

export class ImageListFilterOptions {
    public imageIDList: number[] = [];
    public imageTypeIDList: number[] = [];
    public uploadedByUserIDList: number[] = [];
    public publishedByUserIDList: number[] = [];
    public verifiedByUserIDList: number[] = [];
    public uploadTimeStart = 0;
    public uploadTimeEnd = 0;
    public publishTimeStart = 0;
    public publishTimeEnd = 0;
    public verifyTimeStart = 0;
    public verifyTimeEnd = 0;
    public originalFileNameQuery = "";
    public imageStatusList: ImageStatus[] = [];
}

export interface ImageManagementOperator {
    createImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageTypeID: number | undefined,
        imageTagIDList: number[],
        description: string | undefined,
        imageData: Buffer
    ): Promise<Image>;
    updateImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIDList: number[],
        imageTypeID: number
    ): Promise<void>;
    deleteImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageIDList: number[]
    ): Promise<void>;
    getImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number
    ): Promise<{
        image: Image;
        imageTagList: ImageTag[];
        regionList: Region[];
    }>;
    getImageRegionSnapshotList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        atStatus: ImageStatus
    ): Promise<Region[]>;
    updateImageMetadata(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        description: string | undefined
    ): Promise<Image>;
    updateImageType(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        imageTypeID: number
    ): Promise<Image>;
    updateImageStatus(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        status: ImageStatus
    ): Promise<Image>;
    deleteImage(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number
    ): Promise<void>;
    getUserImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{
        imageList: Image[];
        imageTagList: ImageTag[][];
    }>;
    getUserManageableImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{
        imageList: Image[];
        imageTagList: ImageTag[][];
    }>;
    getUserVerifiableImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{
        imageList: Image[];
        imageTagList: ImageTag[][];
    }>;
    getUserExportableImageList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number,
        sortOrder: number,
        filterOptions: ImageListFilterOptions
    ): Promise<{
        imageList: Image[];
        imageTagList: ImageTag[][];
    }>;
}
