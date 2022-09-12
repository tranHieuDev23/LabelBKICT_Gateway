import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import { ExportManagementOperator, EXPORT_MANAGEMENT_OPERATOR_TOKEN } from "../../module/exports";
import { ExportType } from "../../module/schemas";
import { _ExportType_Values } from "../../proto/gen/ExportType";
import {
    AuthenticatedUserInformation,
    AuthMiddlewareFactory,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    checkUserHasUserPermission,
} from "../utils";
import { getImageListFilterOptionsFromBody } from "./utils";

const IMAGES_EXPORT_PERMISSION = "images.export";
const DEFAULT_GET_EXPORT_LIST_LIMIT = 10;

export function getExportsRouter(
    exportManagementOperator: ExportManagementOperator,
    authMiddlewareFactory: AuthMiddlewareFactory
): express.Router {
    const router = express.Router();

    const userLoggedInAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(() => true, true);
    const imagesExportAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(
        (authUserInfo) => checkUserHasUserPermission(authUserInfo.userPermissionList, IMAGES_EXPORT_PERMISSION),
        true
    );

    router.post(
        "/api/exports",
        userLoggedInAuthMiddleware,
        imagesExportAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const type = req.body.type || _ExportType_Values.DATASET;
            const filterOptions = getImageListFilterOptionsFromBody(req.body.filter_options || {});
            const exportRequest = await exportManagementOperator.createExport(
                authenticatedUserInfo,
                type,
                filterOptions
            );
            res.json({
                export: exportRequest,
            });
        })
    );

    router.get(
        "/api/exports",
        userLoggedInAuthMiddleware,
        imagesExportAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const offset = +(req.query.offset || 0);
            const limit = +(req.query.limit || DEFAULT_GET_EXPORT_LIST_LIMIT);
            const { totalExportCount, exportList } = await exportManagementOperator.getExportList(
                authenticatedUserInfo,
                offset,
                limit
            );
            res.json({
                total_export_count: totalExportCount,
                export_list: exportList,
            });
        })
    );

    router.get(
        "/api/exports/:exportId/exported-file",
        userLoggedInAuthMiddleware,
        imagesExportAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const exportId = +req.params.exportId;
            const { export: exportRequest, exportFileStream } = await exportManagementOperator.getExportFile(
                authenticatedUserInfo,
                exportId
            );
            if (exportRequest.type === ExportType.DATASET) {
                res.setHeader("content-type", "application/zip");
            }
            if (exportRequest.type === ExportType.EXCEL) {
                res.setHeader("content-type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            }
            res.setHeader("Content-Disposition", `inline; filename="${exportRequest.exported_file_filename}"`);
            exportFileStream.pipe(res);
        })
    );

    router.delete(
        "/api/exports/:exportId",
        userLoggedInAuthMiddleware,
        imagesExportAuthMiddleware,
        asyncHandler(async (req, res) => {
            const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
            const exportId = +req.params.exportId;
            await exportManagementOperator.deleteExport(authenticatedUserInfo, exportId);
            res.json({});
        })
    );

    return router;
}

injected(getExportsRouter, EXPORT_MANAGEMENT_OPERATOR_TOKEN, AUTH_MIDDLEWARE_FACTORY_TOKEN);

export const EXPORTS_ROUTER_TOKEN = token<express.Router>("ExportsRouter");
