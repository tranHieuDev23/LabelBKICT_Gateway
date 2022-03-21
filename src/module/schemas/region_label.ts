import { RegionLabel as RegionLabelProto } from "../../proto/gen/RegionLabel";

export class RegionLabel {
    constructor(
        public id: number,
        public display_name: string,
        public color: string
    ) {}

    public static fromProto(
        regionLabelProto: RegionLabelProto | undefined
    ): RegionLabel {
        return new RegionLabel(
            regionLabelProto?.id || 0,
            regionLabelProto?.displayName || "",
            regionLabelProto?.color || ""
        );
    }
}
