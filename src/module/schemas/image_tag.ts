import { ImageTag as ImageTagProto } from "../../proto/gen/ImageTag";

export class ImageTag {
    constructor(public id: number, public display_name: string) {}

    public static fromProto(
        imageTagProto: ImageTagProto | undefined
    ): ImageTag {
        return new ImageTag(
            imageTagProto?.id || 0,
            imageTagProto?.displayName || ""
        );
    }
}
