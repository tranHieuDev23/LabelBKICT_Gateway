import { injected, token } from "brandi";
import { Region as RegionProto } from "../../../proto/gen/Region";
import { Polygon } from "../polygon";
import { Region } from "../region";
import { RegionLabel } from "../region_label";
import {
    UserIDToUserConverter,
    USER_ID_TO_USER_CONVERTER_TOKEN,
} from "./user_id_to_user";

export interface RegionProtoToRegionConverter {
    convert(regionProto: RegionProto | undefined): Promise<Region>;
}

export class RegionProtoToRegionConverterImpl
    implements RegionProtoToRegionConverter
{
    constructor(
        private readonly userIDToUserConverter: UserIDToUserConverter
    ) {}

    public async convert(
        regionProto: RegionProto | undefined
    ): Promise<Region> {
        const regionID = regionProto?.id || 0;
        const drawnByUser = await this.userIDToUserConverter.convert(
            regionProto?.drawnByUserId
        );
        const labeledByUser = await this.userIDToUserConverter.convert(
            regionProto?.labeledByUserId
        );
        const border = regionProto?.border
            ? Polygon.fromProto(regionProto.border)
            : new Polygon([]);
        const holes =
            regionProto?.holes?.map((hole) => Polygon.fromProto(hole)) || [];
        const label = regionProto?.label
            ? RegionLabel.fromProto(regionProto.label)
            : null;

        return new Region(
            regionID,
            drawnByUser,
            labeledByUser,
            border,
            holes,
            label
        );
    }
}

injected(RegionProtoToRegionConverterImpl, USER_ID_TO_USER_CONVERTER_TOKEN);

export const REGION_PROTO_TO_REGION_CONVERTER_TOKEN =
    token<RegionProtoToRegionConverter>("RegionProtoToRegionConverter");
