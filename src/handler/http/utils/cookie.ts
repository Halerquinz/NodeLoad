import { CookieOptions } from "express";

// Authentication cookie should expire in 7 days
const NODE_LOAD_AUTH_COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 7;

export function getCookieOptions(): CookieOptions {
    return {
        httpOnly: true,
        sameSite: "strict",
        maxAge: NODE_LOAD_AUTH_COOKIE_MAX_AGE,
    };
}
