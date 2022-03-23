import { Polygon } from "./polygon";
import { RegionLabel } from "./region_label";
import { User } from "./user";

export class Region {
    constructor(
        public id: number,
        public drawn_by_user: User | null,
        public labeled_by_user: User | null,
        public borders: Polygon,
        public holes: Polygon[],
        public label: RegionLabel | null
    ) {}
}
