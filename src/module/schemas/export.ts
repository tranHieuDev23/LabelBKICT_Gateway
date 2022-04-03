import { User } from "./user";

export enum ExportType {
    DATASET = 0,
    EXCEL = 1,
}

export enum ExportStatus {
    REQUESTED = 0,
    PROCESSING = 1,
    DONE = 2,
}

export class Export {
    constructor(
        public id: number,
        public requested_by_user: User,
        public type: ExportType,
        public request_time: number,
        public status: ExportStatus,
        public expire_time: number,
        public exported_file_url: string
    ) {}
}
