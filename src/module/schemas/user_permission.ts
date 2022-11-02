import { UserPermission as UserPermissionProto } from "../../proto/gen/UserPermission";

export class UserPermission {
    constructor(
        public readonly id: number,
        public readonly permission_name: string,
        public readonly description: string
    ) {}

    public static fromProto(
        userProto: UserPermissionProto | undefined
    ): UserPermission {
        return new UserPermission(
            userProto?.id || 0,
            userProto?.permissionName || "",
            userProto?.description || ""
        );
    }
}
