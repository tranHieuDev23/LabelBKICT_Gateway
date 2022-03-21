import { injected, token } from "brandi";
import express from "express";

export function getImagesRouter(): express.Router {
    const router = express.Router();

    return router;
}

injected(getImagesRouter);

export const IMAGES_ROUTER_TOKEN = token<express.Router>("ImagesRouter");
