import { injected, token } from "brandi";
import { Logger } from "winston";
import { ApplicationConfig, APPLICATION_CONFIG_TOKEN } from "../../config";
import { PIN_PAGE_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";
import { PinPageServiceClient } from "../../proto/gen/PinPageService";
import { AuthenticatedUserInformation } from "../../service/utils";
import { LOGGER_TOKEN } from "../../utils";
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
        private readonly applicationConfig: ApplicationConfig,
        private readonly logger: Logger
    ) {}

    public async createPinnedPage(
        authUserInfo: AuthenticatedUserInformation,
        url: string,
        description: string,
        screenshotData: Buffer
    ): Promise<PinnedPage> {
        throw new Error("Method not implemented.");
    }

    public async getPinnedPageList(
        authUserInfo: AuthenticatedUserInformation,
        offset: number,
        limit: number
    ): Promise<{ totalPinnedPageCount: number; pinnedPageList: PinnedPage[] }> {
        throw new Error("Method not implemented.");
    }

    public async updatePinnedPage(
        authUserInfo: AuthenticatedUserInformation,
        id: number,
        description: string | undefined
    ): Promise<PinnedPage> {
        throw new Error("Method not implemented.");
    }

    public async deletePinnedPage(
        authUserInfo: AuthenticatedUserInformation,
        id: number
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }
}

injected(
    PinnedPageManagementOperatorImpl,
    PIN_PAGE_SERVICE_DM_TOKEN,
    PINNED_PAGE_PROTO_TO_PINNED_PAGE_CONVERTER_TOKEN,
    APPLICATION_CONFIG_TOKEN,
    LOGGER_TOKEN
);

export const PINNED_PAGE_MANAGEMENT_OPERATOR_TOKEN =
    token<PinnedPageManagementOperator>("PinnedPageManagementOperator");