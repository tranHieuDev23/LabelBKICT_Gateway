import { AuthenticatedUserInformation } from "../../service/utils";
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
