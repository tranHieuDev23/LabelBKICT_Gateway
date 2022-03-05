import { injected, token } from "brandi";
import { User, UserRole } from "../schemas";

export interface UserManagementOperator {
    createUser(
        username: string,
        displayName: string,
        password: string
    ): Promise<User>;
    getUserList(
        offset: number,
        limit: number,
        sortOrder: number,
        withUserRole: boolean
    ): Promise<{
        totalUserCount: number;
        userList: User[];
        useRoleList: UserRole[] | undefined;
    }>;
    updateUser(
        id: number,
        username: string | undefined,
        displayName: string | undefined,
        password: string | undefined
    ): Promise<User>;
}

export class UserManagementOperatorImpl implements UserManagementOperator {
    public async createUser(
        username: string,
        displayName: string,
        password: string
    ): Promise<User> {
        throw new Error("Method not implemented.");
    }

    public async getUserList(
        offset: number,
        limit: number,
        sortOrder: number,
        withUserRole: boolean
    ): Promise<{
        totalUserCount: number;
        userList: User[];
        useRoleList: UserRole[] | undefined;
    }> {
        throw new Error("Method not implemented.");
    }

    public async updateUser(
        id: number,
        username: string | undefined,
        displayName: string | undefined,
        password: string | undefined
    ): Promise<User> {
        throw new Error("Method not implemented.");
    }
}

injected(UserManagementOperatorImpl);

export const USER_MANAGEMENT_OPERATOR_TOKEN = token<UserManagementOperator>(
    "UserManagementOperator"
);
