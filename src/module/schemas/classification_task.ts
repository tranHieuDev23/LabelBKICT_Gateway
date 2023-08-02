import { ClassificationTask as ClassificationTaskProto } from "../../proto/gen/ClassificationTask";

export enum ClassificationTaskStatus {
    REQUESTED = 0,
    DONE = 1,
}

export class ClassificationTaskImage {
    constructor(public id: number, public thumbnail_url: string) {}
}

export class ClassificationTask {
    constructor(
        public id: number,
        public of_image: ClassificationTaskImage,
        public of_classification_type_id: number,
        public request_time: number,
        public status: ClassificationTaskStatus
    ) {}
}
