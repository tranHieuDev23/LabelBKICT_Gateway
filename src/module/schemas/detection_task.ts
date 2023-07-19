import { Image } from "./image";

export enum DetectionTaskStatus {
    REQUESTED = 0,
    PROCESSING = 1,
    DONE = 2,
}

export class DetectionTaskImage {
    constructor(id: number, thumbnail_url: string) {}
}

export class DetectionTask {
    constructor(
        public id: number,
        public of_image: DetectionTaskImage,
        public request_time: number,
        public status: DetectionTaskStatus,
        public update_time: number
    ) {}
}
