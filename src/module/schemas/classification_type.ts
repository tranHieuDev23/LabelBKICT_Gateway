import { ClassificationType as ClassificationTypeProto } from "../../proto/gen/ClassificationType";

export class ClassificationType {
    constructor(
        public classification_type_id: number,
        public display_name: string
    ) {}

    public static fromProto(
        imageTypeProto: ClassificationTypeProto | undefined
    ): ClassificationType {
        return new ClassificationType(
            imageTypeProto?.classificationTypeId || 0,
            imageTypeProto?.displayName || ""
        );
    }
}