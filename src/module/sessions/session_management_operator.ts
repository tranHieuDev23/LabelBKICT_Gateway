import { injected, token } from "brandi";
import { User, UserPermission, UserRole } from "../schemas";

export interface SessionManagementOperator {
    LoginWithPassword(
        username: string,
        password: string
    ): Promise<{
        user: User;
        userRoleList: UserRole[];
        userPermissionList: UserPermission[];
        token: string;
    }>;
    Logout(token: string): Promise<void>;
    GetUserOfSession(token: string): Promise<{ user: User; newToken: string }>;
}

export class SessionManagementOperatorImpl
    implements SessionManagementOperator
{
    public async LoginWithPassword(
        username: string,
        password: string
    ): Promise<{
        user: User;
        userRoleList: UserRole[];
        userPermissionList: UserPermission[];
        token: string;
    }> {
        throw new Error("Method not implemented.");
    }

    public async Logout(token: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async GetUserOfSession(
        token: string
    ): Promise<{ user: User; newToken: string }> {
        throw new Error("Method not implemented.");
    }
}

injected(SessionManagementOperatorImpl);

export const SESSION_MANAGEMENT_OPERATOR_TOKEN =
    token<SessionManagementOperator>("SessionManagementOperator");
