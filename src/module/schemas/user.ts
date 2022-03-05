import { User as UserProto } from "../../proto/gen/User";

export class User {
    constructor(
        public readonly id: number,
        public readonly username: string,
        public readonly displayName: string
    ) {}

    public static fromProto(userProto: UserProto | undefined): User {
        return new User(
            userProto?.id || 0,
            userProto?.username || "",
            userProto?.displayName || ""
        );
    }
}
