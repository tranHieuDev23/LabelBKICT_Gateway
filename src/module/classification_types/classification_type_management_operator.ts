import { injected, token } from "brandi";
import { ErrorWithHTTPCode, LOGGER_TOKEN, getHttpCodeFromGRPCStatus, promisifyGRPCCall } from "../../utils";
import { Logger } from "winston";
import { ClassificationType } from "../schemas";
import { ModelServiceClient } from "../../proto/gen/ModelService";
import { MODEL_SERVICE_DM_TOKEN } from "../../dataaccess/grpc";

export interface ClassificationTypeManagementOperator {
    getClassificationTypeList(): Promise<ClassificationType[]>;
}

export class ClassificationTypeManagementOperatorImpl implements ClassificationTypeManagementOperator {
    constructor(
        private readonly modelServiceDM: ModelServiceClient,
        private readonly logger: Logger
    ) {}

    public async getClassificationTypeList(): Promise<ClassificationType[]> {
        const {
            error: getClassificationTypeListError,
            response: getClassificationTypeListResponse
        } = await promisifyGRPCCall(
            this.modelServiceDM.getClassificationTypeList.bind(this.modelServiceDM),
            {}
        );
        if (getClassificationTypeListError !== null) {
            this.logger.error(
                "failed to call model_service.getClassificationTypeList()",
                { error: getClassificationTypeListError }
            )
            throw new ErrorWithHTTPCode(
                "failed to get classification type list",
                getHttpCodeFromGRPCStatus(getClassificationTypeListError.code)
            );
        }

        const classificationTypeList = 
            getClassificationTypeListResponse?.classificationTypeList?.map(ClassificationType.fromProto) ||
            [];

        return classificationTypeList;
    }
}

injected(
    ClassificationTypeManagementOperatorImpl,
    MODEL_SERVICE_DM_TOKEN,
    LOGGER_TOKEN
);

export const CLASSIFICATION_TYPE_MANAGEMENT_OPERATOR_TOKEN =
    token<ClassificationTypeManagementOperator>("ClassificationTypeManagementOperator")