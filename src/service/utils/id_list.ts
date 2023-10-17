import qs from "qs";

export function getCommaSeparatedIdList(s: string): number[] {
    if (s === "") {
        return [];
    }
    return s.split(",").map((substring) => +substring);
}

export function getStringListFromQueryParam(
    queryParam: string | string[] | qs.ParsedQs | qs.ParsedQs[] | undefined
): string[] {
    if (typeof queryParam === "string") {
        return [queryParam];
    }
    if (Array.isArray(queryParam)) {
        return queryParam.map((item) => `${item}`);
    }
    return [];
}

export function getIdListFromQueryParam(
    queryParam: string | string[] | qs.ParsedQs | qs.ParsedQs[] | undefined
): number[] {
    return getStringListFromQueryParam(queryParam).map((item) => +item);
}
