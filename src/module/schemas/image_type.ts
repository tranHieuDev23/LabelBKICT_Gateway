import { ImageType as ImageTypeProto } from "../../proto/gen/ImageType";

export class ImageType {
    constructor(
        public id: number,
        public display_name: string,
        public has_predictive_model: boolean
    ) {}

    public static fromProto(
        imageTypeProto: ImageTypeProto | undefined
    ): ImageType {
        return new ImageType(
            imageTypeProto?.id || 0,
            imageTypeProto?.displayName || "",
            imageTypeProto?.hasPredictiveModel || false
        );
    }
}
