import { Polygon } from "./polygon";
import { RegionLabel } from "./region_label";
import { User } from "./user";

export class RegionOperatorLogDrawMetadata {
    constructor(
        public old_border: Polygon,
        public old_holes: Polygon[],
        public new_border: Polygon,
        public new_holes: Polygon[]
    ) {}
}

export class RegionOperatorLogLabelMetadata {
    constructor(public old_label: RegionLabel, public new_label: RegionLabel) {}
}

export enum OperationType {
    DRAW = 0,
    LABEL = 1,
}

export class RegionOperatorLog {
    constructor(
        public id: number,
        public by_user: User,
        public operation_time: number,
        public operation_type: OperationType,
        public operation_metadata:
            | RegionOperatorLogDrawMetadata
            | RegionOperatorLogLabelMetadata
    ) {}
}
