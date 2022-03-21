import { Container, token } from "brandi";
import express from "express";
import { SESSIONS_ROUTER_TOKEN, getSessionsRouter } from "./sessions";
import { getUsersRouter, USERS_ROUTER_TOKEN } from "./users";
import {
    USER_PERMISSIONS_ROUTER_TOKEN,
    getUserPermissionsRouter,
} from "./permissions";
import { USER_ROLES_ROUTER_TOKEN, getUserRolesRouter } from "./roles";
import { getImageTypesRouter, IMAGE_TYPES_ROUTER_TOKEN } from "./image-types";
import {
    IMAGE_TAG_GROUPS_ROUTER_TOKEN,
    getImageTagGroupsRouter,
} from "./image-tag-groups";
import { getImagesRouter, IMAGES_ROUTER_TOKEN } from "./images";

export * from "./users";
export * from "./sessions";
export * from "./roles";
export * from "./permissions";

export const ROUTES_TOKEN = token<express.Router[]>("Routes");

export function bindToContainer(container: Container): void {
    container
        .bind(USERS_ROUTER_TOKEN)
        .toInstance(getUsersRouter)
        .inSingletonScope();
    container
        .bind(SESSIONS_ROUTER_TOKEN)
        .toInstance(getSessionsRouter)
        .inSingletonScope();
    container
        .bind(USER_ROLES_ROUTER_TOKEN)
        .toInstance(getUserRolesRouter)
        .inSingletonScope();
    container
        .bind(USER_PERMISSIONS_ROUTER_TOKEN)
        .toInstance(getUserPermissionsRouter)
        .inSingletonScope();
    container
        .bind(IMAGE_TYPES_ROUTER_TOKEN)
        .toInstance(getImageTypesRouter)
        .inSingletonScope();
    container
        .bind(IMAGE_TAG_GROUPS_ROUTER_TOKEN)
        .toInstance(getImageTagGroupsRouter)
        .inSingletonScope();
    container
        .bind(IMAGES_ROUTER_TOKEN)
        .toInstance(getImagesRouter)
        .inSingletonScope();
    container
        .bind(ROUTES_TOKEN)
        .toInstance(() => [
            container.get(USERS_ROUTER_TOKEN),
            container.get(SESSIONS_ROUTER_TOKEN),
            container.get(USER_ROLES_ROUTER_TOKEN),
            container.get(USER_PERMISSIONS_ROUTER_TOKEN),
            container.get(IMAGE_TYPES_ROUTER_TOKEN),
            container.get(IMAGE_TAG_GROUPS_ROUTER_TOKEN),
            container.get(IMAGES_ROUTER_TOKEN),
        ])
        .inSingletonScope();
}
