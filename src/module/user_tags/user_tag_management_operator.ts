import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { USER_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { _UserTagListSortOrder_Values } from "../../proto/gen/UserTagListSortOrder";
import { UserServiceClient } from "../../proto/gen/UserService";
import {
    ErrorWithHTTPCode,
    getHttpCodeFromGRPCStatus,
    LOGGER_TOKEN,
    promisifyGRPCCall,
} from "../../utils";
import { UserTag } from "../schemas";

export interface UserTagManagementOperator {
    createUserTag(displayName: string, description: string): Promise<UserTag>;
    getUserTagList(
        offset: number,
        limit: number,
        sortOrder: number
    ): Promise<{
        totalUserTagCount: number;
        userTagList: UserTag[];
    }>;
    updateUserTag(
        id: number,
        displayName: string | undefined,
        description: string | undefined
    ): Promise<UserTag>;
    deleteUserTag(id: number): Promise<void>;
    addUserTagToUser(userId: number, userTagId: number): Promise<void>;
    removeUserTagFromUser(userId: number, userTagId: number): Promise<void>;
}

export class UserTagManagementOperatorImpl
    implements UserTagManagementOperator
{
    constructor(
        private readonly userServiceDM: UserServiceClient,
        private readonly logger: Logger
    ) {}

    public async createUserTag(
        displayName: string,
        description: string
    ): Promise<UserTag> {
        const { error: createUserTagError, response: createUserTagResponse } =
            await promisifyGRPCCall(
                this.userServiceDM.createUserTag.bind(this.userServiceDM),
                { displayName, description }
            );
        if (createUserTagError !== null) {
            this.logger.error("failed to call user_service.createUserTag()", {
                error: createUserTagError,
            });
            throw new ErrorWithHTTPCode(
                "failed to create new user tag",
                getHttpCodeFromGRPCStatus(createUserTagError.code)
            );
        }

        return UserTag.fromProto(createUserTagResponse?.userTag);
    }

    public async getUserTagList(
        offset: number,
        limit: number,
        sortOrder: number
    ): Promise<{
        totalUserTagCount: number;
        userTagList: UserTag[];
    }> {
        const sortOrderEnumValue = this.getSortOrderEnumValue(sortOrder);
        const { error: getUserTagListError, response: getUserTagListResponse } =
            await promisifyGRPCCall(
                this.userServiceDM.getUserTagList.bind(this.userServiceDM),
                { limit, offset, sortOrder: sortOrderEnumValue }
            );
        if (getUserTagListError !== null) {
            this.logger.error("failed to call user_service.getUserTagList()", {
                error: getUserTagListError,
            });
            throw new ErrorWithHTTPCode(
                "failed to call user_service.getUserTagList()",
                getHttpCodeFromGRPCStatus(getUserTagListError.code)
            );
        }

        const totalUserTagCount =
            getUserTagListResponse?.totalUserTagCount || 0;
        const userTagList: UserTag[] =
            getUserTagListResponse?.userTagList?.map((userTagProto) =>
                UserTag.fromProto(userTagProto)
            ) || [];

        return { totalUserTagCount, userTagList };
    }

    private getSortOrderEnumValue(
        sortOrder: number
    ): _UserTagListSortOrder_Values {
        switch (sortOrder) {
            case 0:
                return _UserTagListSortOrder_Values.ID_ASCENDING;
            case 1:
                return _UserTagListSortOrder_Values.ID_DESCENDING;
            case 2:
                return _UserTagListSortOrder_Values.DISPLAY_NAME_ASCENDING;
            case 3:
                return _UserTagListSortOrder_Values.DISPLAY_NAME_DESCENDING;
            default:
                throw new ErrorWithHTTPCode(
                    "invalid sort order",
                    httpStatus.BAD_REQUEST
                );
        }
    }

    public async updateUserTag(
        id: number,
        displayName: string | undefined,
        description: string | undefined
    ): Promise<UserTag> {
        const { error: updateUserTagError, response: updateUserTagResponse } =
            await promisifyGRPCCall(
                this.userServiceDM.updateUserTag.bind(this.userServiceDM),
                { userTag: { id, displayName, description } }
            );
        if (updateUserTagError !== null) {
            this.logger.error("failed to call user_service.updateUserTag()", {
                error: updateUserTagError,
            });
            throw new ErrorWithHTTPCode(
                "failed to update user tag",
                getHttpCodeFromGRPCStatus(updateUserTagError.code)
            );
        }

        return UserTag.fromProto(updateUserTagResponse?.userTag);
    }

    public async deleteUserTag(id: number): Promise<void> {
        const { error: deleteUserTagError } = await promisifyGRPCCall(
            this.userServiceDM.deleteUserTag.bind(this.userServiceDM),
            { id }
        );
        if (deleteUserTagError !== null) {
            this.logger.error("failed to call user_service.deleteUserTag()", {
                error: deleteUserTagError,
            });
            throw new ErrorWithHTTPCode(
                "failed to delete user tag",
                getHttpCodeFromGRPCStatus(deleteUserTagError.code)
            );
        }
    }

    public async addUserTagToUser(
        userId: number,
        userTagId: number
    ): Promise<void> {
        const { error: addUserTagToUserError } = await promisifyGRPCCall(
            this.userServiceDM.addUserTagToUser.bind(this.userServiceDM),
            { userId: userId, userTagId: userTagId }
        );
        if (addUserTagToUserError !== null) {
            this.logger.error(
                "failed to call user_service.addUserTagToUser()",
                { error: addUserTagToUserError }
            );
            throw new ErrorWithHTTPCode(
                "failed to add user tag to user",
                getHttpCodeFromGRPCStatus(addUserTagToUserError.code)
            );
        }
    }

    public async removeUserTagFromUser(
        userId: number,
        userTagId: number
    ): Promise<void> {
        const { error: removeUserTagFromUserError } = await promisifyGRPCCall(
            this.userServiceDM.removeUserTagFromUser.bind(this.userServiceDM),
            { userId: userId, userTagId: userTagId }
        );
        if (removeUserTagFromUserError !== null) {
            this.logger.error(
                "failed to call user_service.removeUserTagFromUser()",
                { error: removeUserTagFromUserError }
            );
            throw new ErrorWithHTTPCode(
                "failed to remove user tag from user",
                getHttpCodeFromGRPCStatus(removeUserTagFromUserError.code)
            );
        }
    }
}

injected(UserTagManagementOperatorImpl, USER_SERVICE_DM_TOKEN, LOGGER_TOKEN);

export const USER_TAG_MANAGEMENT_OPERATOR_TOKEN =
    token<UserTagManagementOperator>("UserTagManagementOperator");
