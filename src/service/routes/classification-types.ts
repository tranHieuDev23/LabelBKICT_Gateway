import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import { AuthMiddlewareFactory, AUTH_MIDDLEWARE_FACTORY_TOKEN } from "../utils";
import { CLASSIFICATION_TYPE_MANAGEMENT_OPERATOR_TOKEN, ClassificationTypeManagementOperator } from "../../module/classification_types";

export function getClassificationTypesRouter(
	classificationTypeManagementOperator: ClassificationTypeManagementOperator,
	authMiddlewareFactory: AuthMiddlewareFactory
): express.Router {
	const router = express.Router();

	const userLoggedInAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(() => true, true);

	router.get(
		"/api/classification-types",
		userLoggedInAuthMiddleware,
		asyncHandler(async (req, res) => {
			const classificationTypeList = await classificationTypeManagementOperator.getClassificationTypeList();
			res.json({
				classification_type_list: classificationTypeList
			});

		})
	);

	return router;
}

injected(
	getClassificationTypesRouter,
	CLASSIFICATION_TYPE_MANAGEMENT_OPERATOR_TOKEN,
	AUTH_MIDDLEWARE_FACTORY_TOKEN
);

export const CLASSIFICATION_TYPES_ROUTER_TOKEN = token<express.Router>("ClassificationTypesRouter");
