import { ImageType } from "./image_type";
import { User } from "./user";

export enum ImageStatus {
    UPLOADED = 0,
    PUBLISHED = 1,
    VERIFIED = 2,
    EXCLUDED = 3,
}

export class Image {
    constructor(
        public id: number,
        public uploaded_by_user: User,
        public upload_time: number,
        public published_by_user: User,
        public publish_time: number,
        public verified_by_user: User,
        public verify_time: number,
        public original_file_name: string,
        public original_image_url: string,
        public thumbnail_url: string,
        public description: string,
        public image_type: ImageType,
        public status: ImageStatus
    ) {}
}
