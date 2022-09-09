import { UserTag } from "../../module/schemas";

const USER_TAG_DISABLED_DISPLAY_NAME = "Disabled";

export function checkUserIsDisabled(
    userTagList: UserTag[]
): boolean {
    return (
        userTagList.find(
            (userTag) =>
                userTag.display_name === USER_TAG_DISABLED_DISPLAY_NAME
        ) === undefined
    );
}
