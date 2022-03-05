import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { USER_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { UserServiceClient } from "../../proto/gen/UserService";
import {
    ErrorWithHTTPCode,
    getHttpCodeFromGRPCStatus,
    LOGGER_TOKEN,
} from "../../utils";
import { promisifyGRPCCall } from "../../utils/grpc";
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
    constructor(
        private readonly userServiceDM: UserServiceClient,
        private readonly logger: Logger
    ) {}

    public async createUser(
        username: string,
        displayName: string,
        password: string
    ): Promise<User> {
        const { error: createUserError, response: createUserResponse } =
            await promisifyGRPCCall(
                this.userServiceDM.CreateUser.bind(this.userServiceDM),
                {
                    username,
                    displayName,
                }
            );
        if (createUserError !== null) {
            this.logger.error("failed to call user_service.CreateUser()", {
                error: createUserError,
            });
            throw new ErrorWithHTTPCode(
                "failed to create new user",
                getHttpCodeFromGRPCStatus(createUserError.code)
            );
        }

        // At this point, the newly created user with all information should be available.
        const userID = createUserResponse?.user?.id || 0;
        const userUsername = createUserResponse?.user?.username || "";
        const userDisplayName = createUserResponse?.user?.displayName || "";
        const { error: createUserPasswordError } = await promisifyGRPCCall(
            this.userServiceDM.CreateUserPassword.bind(this.userServiceDM),
            {
                password: {
                    ofUserId: userID,
                    password: password,
                },
            }
        );
        if (createUserPasswordError !== null) {
            this.logger.error(
                "failed to call user_service.CreateUserPassword()",
                {
                    error: createUserError,
                }
            );
            throw new ErrorWithHTTPCode(
                "failed to create new user's password",
                getHttpCodeFromGRPCStatus(createUserPasswordError.code)
            );
        }

        return new User(userID, userUsername, userDisplayName);
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

injected(UserManagementOperatorImpl, USER_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const USER_MANAGEMENT_OPERATOR_TOKEN = token<UserManagementOperator>(
    "UserManagementOperator"
);
