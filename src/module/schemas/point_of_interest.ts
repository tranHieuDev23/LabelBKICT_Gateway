import { Vertex } from "./polygon";
import { User } from "./user";

export class PointOfInterest {
    constructor(
        public id: number,
        public created_by_user: User,
        public created_time: number,
        public updated_time: number,
        public coordinate: Vertex,
        public description: string
    ) {}
}
