import { Logger } from "winston";
import { PointOfInterest as PointOfInterestProto } from "../../../proto/gen/PointOfInterest";
import { USER_INFO_PROVIDER_TOKEN, UserInfoProvider } from "../../info_providers";
import { PointOfInterest } from "../point_of_interest";
import { Vertex } from "../polygon";
import { ErrorWithHTTPCode, LOGGER_TOKEN } from "../../../utils";
import httpStatus from "http-status";
import { User } from "../user";
import { injected, token } from "brandi";

export interface PointOfInterestProtoToPointOfInterestConverter {
    convert(poi: PointOfInterestProto | undefined): Promise<PointOfInterest>;
}

export class PointOfInterestProtoToPointOfInterestConverterImpl {
    constructor(private readonly userInfoProvider: UserInfoProvider, private readonly logger: Logger) {}

    public async convert(poi: PointOfInterestProto | undefined): Promise<PointOfInterest> {
        const createdByUser = await this.userInfoProvider.getUser(poi?.createdByUserId || 0);
        if (createdByUser === null) {
            this.logger.error("no user with created_by_user_id found", { createdByUserId: poi?.createdByUserId });
            throw new ErrorWithHTTPCode(
                `no user with created_by_user_id ${poi?.createdByUserId} found`,
                httpStatus.NOT_FOUND
            );
        }

        return new PointOfInterest(
            poi?.id || 0,
            User.fromProto(createdByUser),
            +(poi?.createdTime || 0),
            +(poi?.updatedTime || 0),
            Vertex.fromProto(poi?.coordinate || undefined),
            poi?.description || ""
        );
    }
}

injected(PointOfInterestProtoToPointOfInterestConverterImpl, USER_INFO_PROVIDER_TOKEN, LOGGER_TOKEN);

export const POINT_OF_INTEREST_PROTO_TO_POINT_OF_INTEREST_CONVERTER_TOKEN =
    token<PointOfInterestProtoToPointOfInterestConverter>("PointOfInterestProtoToPointOfInterestConverter");
