import { injected, token } from "brandi";
import { Request, RequestHandler } from "express";
import asyncHandler from "express-async-handler";
import httpStatus from "http-status";
import { User } from "../../../dataaccess/db";
import { TOKEN_MANAGEMENT_OPERATOR_TOKEN, TokenManagementOperator } from "../../../module/token";
import { ErrorWithHTTPCode } from "../../../utils";
import { getCookieOptions } from "./cookie";

export class AuthenticatedUserInformation {
    constructor(
        public readonly user: User,
        public readonly token: string,
    ) { }
}

export declare type AuthorizationFunc = (authUserInfo: AuthenticatedUserInformation, request: Request) => boolean;

export interface AuthMiddlewareFactory {
    getAuthMiddleware(authorizationFunc: AuthorizationFunc, shouldRenewToken: boolean): RequestHandler;
}

export const NODE_LOAD_AUTH_COOKIE_NAME = "NODE_LOAD_AUTH";

export class AuthMiddlewareFactoryImpl implements AuthMiddlewareFactory {
    constructor(
        private readonly tokenManagementOperator: TokenManagementOperator
    ) { }

    public getAuthMiddleware(authorizationFunc: AuthorizationFunc, shouldRenewToken: boolean): RequestHandler {
        return asyncHandler(async (req, res, next) => {
            const token = req.cookies[NODE_LOAD_AUTH_COOKIE_NAME];
            if (token === undefined) {
                throw new ErrorWithHTTPCode("user is not logged in", httpStatus.UNAUTHORIZED);
            }

            let user: User;
            let newToken: string | null;

            try {
                const userFromToken = await this.tokenManagementOperator.getUserFromToken(token);
                user = userFromToken.user!;
                newToken = userFromToken.newToken!;
            } catch (error) {
                if (error instanceof ErrorWithHTTPCode && error.code === httpStatus.UNAUTHORIZED) {
                    res.clearCookie(NODE_LOAD_AUTH_COOKIE_NAME);
                }
                throw error;
            }

            const authenticatedUserInformation = new AuthenticatedUserInformation(user, token);

            const isUserAuthorized = authorizationFunc(authenticatedUserInformation, req);
            if (!isUserAuthorized) {
                throw new ErrorWithHTTPCode("user is not authorized to perform the operation", httpStatus.FORBIDDEN);
            }

            res.locals.authenticatedUserInformation = authenticatedUserInformation;
            if (newToken !== null && shouldRenewToken) {
                res.cookie(NODE_LOAD_AUTH_COOKIE_NAME, newToken, getCookieOptions());
            }

            next();
        });
    }
}

injected(AuthMiddlewareFactoryImpl, TOKEN_MANAGEMENT_OPERATOR_TOKEN);

export const AUTH_MIDDLEWARE_FACTORY_TOKEN = token<AuthMiddlewareFactory>("AuthMiddlewareFactory");