import { injected, token } from "brandi";
import { Logger } from "winston";
import {
    USER_SERVICE_DM_TOKEN,
    IMAGE_SERVICE_DM_TOKEN,
} from "../../dataaccess/grpc";
import { ImageServiceClient } from "../../proto/gen/ImageService";
import { UserServiceClient } from "../../proto/gen/UserService";
import { AuthenticatedUserInformation } from "../../service/utils";
import { LOGGER_TOKEN } from "../../utils";
import { ImageManagementOperatorImpl } from "../images";
import { Polygon, Region, RegionOperatorLog } from "../schemas";

export interface RegionManagementOperator {
    createRegion(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        border: Polygon,
        holes: Polygon[],
        regionLabelID: number
    ): Promise<Region>;
    updateRegionBoundary(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        regionID: number,
        border: Polygon,
        holes: Polygon[]
    ): Promise<Region>;
    updateRegionLabel(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        regionID: number,
        regionLabelID: number
    ): Promise<Region>;
    deleteRegion(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        regionID: number
    ): Promise<void>;
    getRegionOperationLogList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        regionID: number
    ): Promise<RegionOperatorLog[]>;
}

export class RegionManagementOperatorImpl implements RegionManagementOperator {
    constructor(
        private readonly userServiceDM: UserServiceClient,
        private readonly imageServiceDM: ImageServiceClient,
        private readonly logger: Logger
    ) {}

    public async createRegion(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        border: Polygon,
        holes: Polygon[],
        regionLabelID: number
    ): Promise<Region> {
        throw new Error("Method not implemented.");
    }

    public async updateRegionBoundary(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        regionID: number,
        border: Polygon,
        holes: Polygon[]
    ): Promise<Region> {
        throw new Error("Method not implemented.");
    }

    public async updateRegionLabel(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        regionID: number,
        regionLabelID: number
    ): Promise<Region> {
        throw new Error("Method not implemented.");
    }

    public async deleteRegion(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        regionID: number
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async getRegionOperationLogList(
        authenticatedUserInfo: AuthenticatedUserInformation,
        imageID: number,
        regionID: number
    ): Promise<RegionOperatorLog[]> {
        throw new Error("Method not implemented.");
    }
}

injected(
    ImageManagementOperatorImpl,
    USER_SERVICE_DM_TOKEN,
    IMAGE_SERVICE_DM_TOKEN,
    LOGGER_TOKEN
);

export const REGION_MANAGEMENT_OPERATOR_TOKEN = token<RegionManagementOperator>(
    "RegionManagementOperator"
);
