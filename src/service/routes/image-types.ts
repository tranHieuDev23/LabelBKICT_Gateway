import { injected, token } from "brandi";
import express from "express";

export function getImageTypesRouter(): express.Router {
    const router = express.Router();

    return router;
}

injected(getImageTypesRouter);

export const IMAGE_TYPES_ROUTER_TOKEN =
    token<express.Router>("ImageTypesRouter");
