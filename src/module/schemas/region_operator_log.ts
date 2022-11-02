import { Polygon } from "./polygon";
import { RegionLabel } from "./region_label";
import { User } from "./user";

export class RegionOperationLogDrawMetadata {
    constructor(
        public old_border: Polygon | null,
        public old_holes: Polygon[] | null,
        public new_border: Polygon,
        public new_holes: Polygon[]
    ) {}
}

export class RegionOperationLogLabelMetadata {
    constructor(
        public old_label: RegionLabel | null,
        public new_label: RegionLabel | null
    ) {}
}

export enum OperationType {
    DRAW = 0,
    LABEL = 1,
}

export class RegionOperationLog {
    constructor(
        public id: number,
        public by_user: User | null,
        public operation_time: number,
        public operation_type: OperationType,
        public operation_metadata:
            | RegionOperationLogDrawMetadata
            | RegionOperationLogLabelMetadata
    ) {}
}
