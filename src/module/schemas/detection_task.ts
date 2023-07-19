import { Image } from "./image";

export enum DetectionTaskStatus {
    REQUESTED = 0,
    PROCESSING = 1,
    DONE = 2,
}

export class DetectionTask {
    constructor(
        public id: number,
        public of_image: Image,
        public request_time: number,
        public status: DetectionTaskStatus,
        public update_time: number
    ) {}
}
