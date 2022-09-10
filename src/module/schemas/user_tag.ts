import { UserTag as UserTagProto } from "../../proto/gen/UserTag";

export class UserTag {
    constructor(
        public readonly id: number,
        public readonly display_name: string,
        public readonly description: string
    ) {}

    public static fromProto(userProto: UserTagProto | undefined): UserTag {
        return new UserTag(
            userProto?.id || 0,
            userProto?.displayName || "",
            userProto?.description || ""
        );
    }
}
