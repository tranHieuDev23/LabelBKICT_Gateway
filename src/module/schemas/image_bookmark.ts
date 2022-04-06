import { ImageBookmark as ImageBookmarkProto } from "../../proto/gen/ImageBookmark";

export class ImageBookmark {
    constructor(public description: string) {}

    public static fromProto(
        imageBookmarkProto: ImageBookmarkProto | undefined
    ): ImageBookmark {
        return new ImageBookmark(imageBookmarkProto?.description || "");
    }
}
