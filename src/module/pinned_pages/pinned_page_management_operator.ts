import { injected, token } from "brandi";
import httpStatus from "http-status";
import { Logger } from "winston";
import { PIN_PAGE_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { PinPageServiceClient } from "../../proto/gen/PinPageService";
import { AuthenticatedUserInformation } from "../../service/utils";
import {
    ErrorWithHTTPCode,
    getHttpCodeFromGRPCStatus,
    LOGGER_TOKEN,
    promisifyGRPCCall,
} from "../../utils";
import {
    PinnedPage,
    PinnedPageProtoToPinnedPageConverter,
    PINNED_PAGE_PROTO_TO_PINNED_PAGE_CONVERTER_TOKEN,
} from "../schemas";

export interface PinnedPageManagementOperator {
    createPinnedPage(
        authUserInfo: AuthenticatedUserInformation,
        url: string,
        description: string,
        screenshotData: Buffer
    ): Promise<PinnedPage>;
    getPinnedPageList(
        authUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number
    ): Promise<{ totalPinnedPageCount: number; pinnedPageList: PinnedPage[] }>;
    updatePinnedPage(
        authUserInfo: AuthenticatedUserInformation,
        id: number,
        description: string | undefined
    ): Promise<PinnedPage>;
    deletePinnedPage(
        authUserInfo: AuthenticatedUserInformation,
        id: number
    ): Promise<void>;
}

export class PinnedPageManagementOperatorImpl
    implements PinnedPageManagementOperator
{
    constructor(
        private readonly pinPageServiceDM: PinPageServiceClient,
        private readonly pinnedPageProtoToPinnedPageConverter: PinnedPageProtoToPinnedPageConverter,
        private readonly logger: Logger
    ) {}

    public async createPinnedPage(
        authUserInfo: AuthenticatedUserInformation,
        url: string,
        description: string,
        screenshotData: Buffer
    ): Promise<PinnedPage> {
        const {
            error: createPinnedPageError,
            response: createPinnedPageResponse,
        } = await promisifyGRPCCall(
            this.pinPageServiceDM.createPinnedPage.bind(this.pinPageServiceDM),
            {
                ofUserId: authUserInfo.user.id,
                url: url,
                description: description,
                screenshotData: screenshotData,
            }
        );
        if (createPinnedPageError !== null) {
            this.logger.error(
                "failed to call pin_page_service.createPinnedPage()",
                { error: createPinnedPageError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to create pinned page",
                getHttpCodeFromGRPCStatus(createPinnedPageError.code)
            );
        }
        return this.pinnedPageProtoToPinnedPageConverter.convert(
            createPinnedPageResponse?.pinnedPage
        );
    }

    public async getPinnedPageList(
        authUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number
    ): Promise<{ totalPinnedPageCount: number; pinnedPageList: PinnedPage[] }> {
        const {
            error: getPinnedPageListError,
            response: getPinnedPageListResponse,
        } = await promisifyGRPCCall(
            this.pinPageServiceDM.getPinnedPageList.bind(this.pinPageServiceDM),
            {
                ofUserId: authUserInfo.user.id,
                offset: offset,
                limit: limit,
            }
        );
        if (getPinnedPageListError !== null) {
            this.logger.error(
                "failed to call pin_page_service.getPinnedPageList()",
                { error: getPinnedPageListError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to get pinned page list",
                getHttpCodeFromGRPCStatus(getPinnedPageListError.code)
            );
        }
        const totalPinnedPageCount =
            getPinnedPageListResponse?.totalPinnedPageCount || 0;
        const pinnedPageProtoList =
            getPinnedPageListResponse?.pinnedPageList || [];
        const pinnedPageList = pinnedPageProtoList.map((pinnedPageProto) =>
            this.pinnedPageProtoToPinnedPageConverter.convert(pinnedPageProto)
        );
        return { totalPinnedPageCount, pinnedPageList };
    }

    public async updatePinnedPage(
        authUserInfo: AuthenticatedUserInformation,
        id: number,
        description: string | undefined
    ): Promise<PinnedPage> {
        const {
            error: getPinnedPageError,
            response: getPinnedPageListResponse,
        } = await promisifyGRPCCall(
            this.pinPageServiceDM.getPinnedPage.bind(this.pinPageServiceDM),
            { id }
        );
        if (getPinnedPageError !== null) {
            this.logger.error(
                "failed to call pin_page_service.getPinnedPage()",
                { error: getPinnedPageError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to update pinned page",
                getHttpCodeFromGRPCStatus(getPinnedPageError.code)
            );
        }

        const pinnedPageProto = getPinnedPageListResponse?.pinnedPage;
        if (pinnedPageProto?.ofUserId !== authUserInfo.user.id) {
            this.logger.error("user is not allowed to access pinned page", {
                user: authUserInfo.user,
                pinnedPageId: id,
            });
            throw new ErrorWithHTTPCode(
                "Failed to update pinned page",
                httpStatus.FORBIDDEN
            );
        }

        const {
            error: updatePinnedPageError,
            response: updatePinnedPageResponse,
        } = await promisifyGRPCCall(
            this.pinPageServiceDM.updatePinnedPage.bind(this.pinPageServiceDM),
            { id, description }
        );
        if (updatePinnedPageError !== null) {
            this.logger.error(
                "failed to call pin_page_service.updatePinnedPage()",
                { error: updatePinnedPageError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to update pinned page",
                getHttpCodeFromGRPCStatus(updatePinnedPageError.code)
            );
        }

        const updatedPinnedPageProto = updatePinnedPageResponse?.pinnedPage;
        const updatedPinnedPage =
            this.pinnedPageProtoToPinnedPageConverter.convert(
                updatedPinnedPageProto
            );
        return updatedPinnedPage;
    }

    public async deletePinnedPage(
        authUserInfo: AuthenticatedUserInformation,
        id: number
    ): Promise<void> {
        const {
            error: getPinnedPageError,
            response: getPinnedPageListResponse,
        } = await promisifyGRPCCall(
            this.pinPageServiceDM.getPinnedPage.bind(this.pinPageServiceDM),
            { id }
        );
        if (getPinnedPageError !== null) {
            this.logger.error(
                "failed to call pin_page_service.getPinnedPage()",
                { error: getPinnedPageError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to delete pinned page",
                getHttpCodeFromGRPCStatus(getPinnedPageError.code)
            );
        }

        const pinnedPageProto = getPinnedPageListResponse?.pinnedPage;
        if (pinnedPageProto?.ofUserId !== authUserInfo.user.id) {
            this.logger.error("user is not allowed to access pinned page", {
                user: authUserInfo.user,
                pinnedPageId: id,
            });
            throw new ErrorWithHTTPCode(
                "Failed to deleted pinned page",
                httpStatus.FORBIDDEN
            );
        }

        const { error: deletePinnedPageError } = await promisifyGRPCCall(
            this.pinPageServiceDM.deletePinnedPage.bind(this.pinPageServiceDM),
            { id }
        );
        if (deletePinnedPageError !== null) {
            this.logger.error(
                "failed to call pin_page_service.deletePinnedPage()",
                { error: deletePinnedPageError }
            );
            throw new ErrorWithHTTPCode(
                "Failed to delete pinned page",
                getHttpCodeFromGRPCStatus(deletePinnedPageError.code)
            );
        }
    }
}

injected(
    PinnedPageManagementOperatorImpl,
    PIN_PAGE_SERVICE_DM_TOKEN,
    PINNED_PAGE_PROTO_TO_PINNED_PAGE_CONVERTER_TOKEN,
    LOGGER_TOKEN
);

export const PINNED_PAGE_MANAGEMENT_OPERATOR_TOKEN =
    token<PinnedPageManagementOperator>("PinnedPageManagementOperator");
