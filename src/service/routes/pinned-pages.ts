import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import {
    PinnedPageManagementOperator,
    PINNED_PAGE_MANAGEMENT_OPERATOR_TOKEN,
} from "../../module/pinned_pages";
import {
    AuthenticatedUserInformation,
    AuthMiddlewareFactory,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    checkUserIsDisabled,
} from "../utils";

const DEFAULT_GET_PINNED_PAGE_LIST_LIMIT = 10;

export function getPinnedPagesRouter(
    pinnedPageManagementOperator: PinnedPageManagementOperator,
    authMiddlewareFactory: AuthMiddlewareFactory
): express.Router {
    const router = express.Router();

    const userLoggedInAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(
        () => true,
        true
    );
    const userDisabledAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(
        (authUserInfo) =>
            checkUserIsDisabled(
                authUserInfo.userTagList
            ),
            true
    );

    router.post(
        "/api/pinned-pages",
        userLoggedInAuthMiddleware,
        userDisabledAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const url = req.body.url || "";
            const description = req.body.description || "";
            const fileList = req.files as Express.Multer.File[];
            const screenshotData = fileList[0].buffer;
            const pinnedPage =
                await pinnedPageManagementOperator.createPinnedPage(
                    authenticatedUserInfo,
                    url,
                    description,
                    screenshotData
                );
            res.json({ pinned_page: pinnedPage });
        })
    );

    router.get(
        "/api/pinned-pages",
        userLoggedInAuthMiddleware,
        userDisabledAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const offset = +(req.query.offset || 0);
            const limit = +(
                req.query.limit || DEFAULT_GET_PINNED_PAGE_LIST_LIMIT
            );
            const { totalPinnedPageCount, pinnedPageList } =
                await pinnedPageManagementOperator.getPinnedPageList(
                    authenticatedUserInfo,
                    offset,
                    limit
                );
            res.json({
                total_pinned_page_count: totalPinnedPageCount,
                pinned_page_list: pinnedPageList,
            });
        })
    );

    router.patch(
        "/api/pinned-pages/:pinnedPageId",
        userLoggedInAuthMiddleware,
        userDisabledAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const pinnedPageId = +req.params.pinnedPageId;
            const description = req.body.description;
            const pinnedPage =
                await pinnedPageManagementOperator.updatePinnedPage(
                    authenticatedUserInfo,
                    pinnedPageId,
                    description
                );
            res.json({ pinned_page: pinnedPage });
        })
    );

    router.delete(
        "/api/pinned-pages/:pinnedPageId",
        userLoggedInAuthMiddleware,
        userDisabledAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals
                .authenticatedUserInformation as AuthenticatedUserInformation;
            const pinnedPageId = +req.params.pinnedPageId;
            await pinnedPageManagementOperator.deletePinnedPage(
                authenticatedUserInfo,
                pinnedPageId
            );
            res.json();
        })
    );

    return router;
}

injected(
    getPinnedPagesRouter,
    PINNED_PAGE_MANAGEMENT_OPERATOR_TOKEN,
    AUTH_MIDDLEWARE_FACTORY_TOKEN
);

export const PINNED_PAGES_ROUTER_TOKEN =
    token<express.Router>("PinnedPagesRouter");
