import { ImageTagGroup as ImageTagGroupProto } from "../../proto/gen/ImageTagGroup";

export class ImageTagGroup {
    constructor(
        public id: number,
        public display_name: string,
        public is_single_value: boolean
    ) {}

    public static fromProto(
        imageTagGroupProto: ImageTagGroupProto | undefined
    ): ImageTagGroup {
        return new ImageTagGroup(
            imageTagGroupProto?.id || 0,
            imageTagGroupProto?.displayName || "",
            imageTagGroupProto?.isSingleValue || false
        );
    }
}
