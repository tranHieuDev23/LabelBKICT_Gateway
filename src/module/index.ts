import { Container } from "brandi";
import * as schemas from "./schemas";
import * as infoProviders from "./info_providers";
import * as sessions from "./sessions";
import * as userTags from "./user_tags";
import * as userPermissions from "./user_permissions";
import * as userRoles from "./user_roles";
import * as users from "./users";
import * as imageTypes from "./image_types";
import * as imageTags from "./image_tags";
import * as images from "./images";
import * as regions from "./regions";
import * as exportModule from "./exports";
import * as pinnedPages from "./pinned_pages";
import * as imagePermissions from "./image_permissions";

export function bindToContainer(container: Container): void {
    schemas.bindToContainer(container);
    infoProviders.bindToContainer(container);
    sessions.bindToContainer(container);
    userTags.bindToContainer(container);
    userPermissions.bindToContainer(container);
    userRoles.bindToContainer(container);
    users.bindToContainer(container);
    imageTypes.bindToContainer(container);
    imageTags.bindToContainer(container);
    images.bindToContainer(container);
    regions.bindToContainer(container);
    exportModule.bindToContainer(container);
    pinnedPages.bindToContainer(container);
    imagePermissions.bindToContainer(container);
}
