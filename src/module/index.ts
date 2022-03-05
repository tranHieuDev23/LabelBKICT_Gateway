import { Container } from "brandi";
import * as sessions from "./sessions";
import * as userPermissions from "./user_permissions";
import * as userRoles from "./user_roles";
import * as users from "./users";

export function bindToContainer(container: Container): void {
    sessions.bindToContainer(container);
    userPermissions.bindToContainer(container);
    userRoles.bindToContainer(container);
    users.bindToContainer(container);
}
