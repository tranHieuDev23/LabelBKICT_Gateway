import { CookieOptions } from "express";

// Authentication cookie should expire in 7 days
const LABEL_BKICT_AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function getCookieOptions(): CookieOptions {
    return {
        httpOnly: true,
        sameSite: "strict",
        maxAge: LABEL_BKICT_AUTH_COOKIE_MAX_AGE,
    };
}
