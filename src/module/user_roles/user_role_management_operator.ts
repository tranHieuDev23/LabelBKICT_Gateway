import { injected, token } from "brandi";
import { UserPermission, UserRole } from "../schemas";

export interface UserRoleManagementOperator {
    createUserRole(displayName: string, description: string): Promise<UserRole>;
    getUserRoleList(
        offset: number,
        limit: number,
        sortOrder: number,
        withUserPermission: boolean
    ): Promise<{
        totalUserRoleCount: number;
        userRoleList: UserRole[];
        userPermissionList: UserPermission[] | undefined;
    }>;
    updateUserRole(
        id: number,
        displayName: string | undefined,
        description: string | undefined
    ): Promise<UserRole>;
    deleteUserRole(id: number): Promise<void>;
    addUserRoleToUser(userID: number, userRoleID: number): Promise<void>;
    removeUserRoleFromUser(userID: number, userRoleID: number): Promise<void>;
}

export class UserRoleManagementOperatorImpl
    implements UserRoleManagementOperator
{
    public async createUserRole(
        displayName: string,
        description: string
    ): Promise<UserRole> {
        throw new Error("Method not implemented.");
    }

    public async getUserRoleList(
        offset: number,
        limit: number,
        sortOrder: number,
        withUserPermission: boolean
    ): Promise<{
        totalUserRoleCount: number;
        userRoleList: UserRole[];
        userPermissionList: UserPermission[] | undefined;
    }> {
        throw new Error("Method not implemented.");
    }

    public async updateUserRole(
        id: number,
        displayName: string | undefined,
        description: string | undefined
    ): Promise<UserRole> {
        throw new Error("Method not implemented.");
    }

    public async deleteUserRole(id: number): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async addUserRoleToUser(
        userID: number,
        userRoleID: number
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async removeUserRoleFromUser(
        userID: number,
        userRoleID: number
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }
}

injected(UserRoleManagementOperatorImpl);

export const USER_ROLE_MANAGEMENT_OPERATOR_TOKEN =
    token<UserRoleManagementOperator>("UserRoleManagementOperator");
