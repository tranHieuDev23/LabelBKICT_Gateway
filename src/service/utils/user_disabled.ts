import { UserTag } from "../../module/schemas";

export function checkUserIsDisabled(
    userTagList: UserTag[],
    tagName: string
): boolean {
    return (
        userTagList.find(
            (userTag) =>
                userTag.display_name === tagName
        ) === undefined
    );
}
