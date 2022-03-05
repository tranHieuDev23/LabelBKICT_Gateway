import { injected, token } from "brandi";
import { UserPermission } from "../schemas";

export interface UserPermissionManagementOperator {
    CreateUserPermission(
        permissionName: string,
        description: string
    ): Promise<UserPermission>;
    GetUserPermissionList(): Promise<UserPermission[]>;
    UpdateUserPermission(
        id: number,
        permissionName: string | undefined,
        description: string | undefined
    ): Promise<UserPermission>;
    DeleteUserPermission(id: number): Promise<void>;
    AddUserPermissionToUserRole(
        userRoleID: number,
        userPermissionID: number
    ): Promise<void>;
    RemoveUserPermissionFromUserRole(
        userRoleID: number,
        userPermissionID: number
    ): Promise<void>;
}

export class UserPermissionManagementOperatorImpl
    implements UserPermissionManagementOperator
{
    public async CreateUserPermission(
        permissionName: string,
        description: string
    ): Promise<UserPermission> {
        throw new Error("Method not implemented.");
    }

    public async GetUserPermissionList(): Promise<UserPermission[]> {
        throw new Error("Method not implemented.");
    }

    public async UpdateUserPermission(
        id: number,
        permissionName: string | undefined,
        description: string | undefined
    ): Promise<UserPermission> {
        throw new Error("Method not implemented.");
    }

    public async DeleteUserPermission(id: number): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async AddUserPermissionToUserRole(
        userRoleID: number,
        userPermissionID: number
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async RemoveUserPermissionFromUserRole(
        userRoleID: number,
        userPermissionID: number
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }
}

injected(UserPermissionManagementOperatorImpl);

export const USER_PERMISSION_MANAGEMENT_OPERATOR_TOKEN =
    token<UserPermissionManagementOperator>("UserPermissionManagementOperator");
