import { injected, token } from "brandi";
import express from "express";

export function getImageTagGroupsRouter(): express.Router {
    const router = express.Router();

    return router;
}

injected(getImageTagGroupsRouter);

export const IMAGE_TAG_GROUPS_ROUTER_TOKEN = token<express.Router>(
    "ImageTagGroupsRouter"
);
