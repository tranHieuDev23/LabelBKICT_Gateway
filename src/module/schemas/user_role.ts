import { UserRole as UserRoleProto } from "../../proto/gen/UserRole";

export class UserRole {
    constructor(
        public readonly id: number,
        public readonly display_name: string,
        public readonly description: string
    ) {}

    public static fromProto(userProto: UserRoleProto | undefined): UserRole {
        return new UserRole(
            userProto?.id || 0,
            userProto?.displayName || "",
            userProto?.description || ""
        );
    }
}
