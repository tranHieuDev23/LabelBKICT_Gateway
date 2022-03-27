import qs from "qs";

export function getCommaSeparatedIdList(s: string): number[] {
    if (s === "") {
        return [];
    }
    return s.split(",").map((substring) => +substring);
}

export function getIdListFromQueryParam(
    queryParam: string | string[] | qs.ParsedQs | qs.ParsedQs[] | undefined
): number[] {
    if (typeof queryParam === "string") {
        return [+queryParam];
    }
    if (Array.isArray(queryParam)) {
        return queryParam.map((item) => +item);
    }
    return [];
}
