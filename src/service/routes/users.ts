import express from "express";
import { Logger } from "winston";
import { UserServiceClient } from "../../proto/gen/UserService";
import { getHttpCodeFromGRPCStatus } from "../../utils";
import { promisifyGrpcCall } from "../../utils/grpc";

export function getUserRouter(
    userServiceClient: UserServiceClient,
    logger: Logger
): express.Router {
    const router = express.Router();

    router.post("", async (req, res) => {
        const username = req.body.username as string;
        const displayName = req.body.display_name as string;
        const password = req.body.password as string;

        const { error: createUserError, response: createUserResponse } =
            await promisifyGrpcCall(
                userServiceClient.CreateUser.bind(userServiceClient),
                {
                    username,
                    displayName,
                }
            );
        if (createUserError !== null) {
            logger.error("failed to call user_service.CreateUser()", {
                error: createUserError,
            });
            return res
                .status(getHttpCodeFromGRPCStatus(createUserError.code))
                .json({});
        }

        // At this point, user and user ID should be provided.
        const userID = createUserResponse?.user?.id || 0;
        const { error: createUserPasswordError } = await promisifyGrpcCall(
            userServiceClient.CreateUserPassword.bind(userServiceClient),
            {
                password: {
                    ofUserId: userID,
                    password: password,
                },
            }
        );
        if (createUserPasswordError !== null) {
            logger.error("failed to call user_service.CreateUserPassword()", {
                error: createUserError,
            });
            return res
                .status(getHttpCodeFromGRPCStatus(createUserPasswordError.code))
                .json({});
        }

        return res.json({
            id: createUserResponse?.user?.id,
            username: createUserResponse?.user?.username,
            display_name: createUserResponse?.user?.displayName,
        });
    });

    router.get("", async (req, res) => {});

    router.patch("/:userID", async (req, res) => {});

    router.post("/:userID/roles", async (req, res) => {});

    router.delete("/:userID/roles/:userRoleID", async (req, res) => {});

    return router;
}
