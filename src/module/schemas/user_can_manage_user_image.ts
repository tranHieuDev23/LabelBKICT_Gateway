import { User } from "./user";

export class UserCanManageUserImage {
    constructor(public user: User, public can_edit: boolean) {}
}
