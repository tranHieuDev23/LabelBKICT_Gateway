import { Container } from "brandi";
import * as schemas from "./schemas";
import * as sessions from "./sessions";
import * as userPermissions from "./user_permissions";
import * as userRoles from "./user_roles";
import * as users from "./users";
import * as imageTypes from "./image_types";
import * as imageTags from "./image_tags";
import * as images from "./images";
import * as regions from "./regions";

export function bindToContainer(container: Container): void {
    schemas.bindToContainer(container);
    sessions.bindToContainer(container);
    userPermissions.bindToContainer(container);
    userRoles.bindToContainer(container);
    users.bindToContainer(container);
    imageTypes.bindToContainer(container);
    imageTags.bindToContainer(container);
    images.bindToContainer(container);
    regions.bindToContainer(container);
}
