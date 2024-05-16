import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import { USER_PASSWORD_MANAGEMENT_OPERATOR_TOKEN, UserPasswordManagementOperator } from "../../../module/password";
import { TOKEN_MANAGEMENT_OPERATOR_TOKEN, TokenManagementOperator } from "../../../module/token";
import {
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    AuthMiddlewareFactory,
    AuthenticatedUserInformation,
    ERROR_HANDLER_MIDDLEWARE_FACTORY_TOKEN,
    ErrorHandlerMiddlewareFactory,
    NODE_LOAD_AUTH_COOKIE_NAME,
    getCookieOptions
} from "../utils";
import { DOWNLOAD_TASK_MANAGEMENT_OPERATOR_TOKEN, DownloadTaskManagementOperator } from "../../../module/download_task";

export function getSessionsRouter(
    tokenManagementOperator: TokenManagementOperator,
    passwordManagementOperator: UserPasswordManagementOperator,
    authMiddlewareFactory: AuthMiddlewareFactory,
    errorHandlerMiddlewareFactory: ErrorHandlerMiddlewareFactory
): express.Router {
    const router = express.Router();

    const userLoggedInAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(() => true, true);
    const userLoggedInAuthMiddlewareWithoutTokenRefresh = authMiddlewareFactory.getAuthMiddleware(() => true, false);

    router.post("/api/sessions/password",
        asyncHandler(async (req, res, next) => {
            errorHandlerMiddlewareFactory.catchToErrorHandlerMiddleware(async () => {
                const username = req.body.username as string;
                const password = req.body.password as string;
                const { user, token } = await passwordManagementOperator.loginWithPassword(
                    username,
                    password
                );
                res.cookie(NODE_LOAD_AUTH_COOKIE_NAME, token, getCookieOptions()).json({
                    user,
                });
            }, next);
        })
    );

    router.get(
        "/api/sessions/user",
        userLoggedInAuthMiddleware,
        asyncHandler(async (_req, res, next) => {
            errorHandlerMiddlewareFactory.catchToErrorHandlerMiddleware(async () => {
                const authenticatedUserInformation = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
                res.json({
                    user: authenticatedUserInformation.user,
                    token: authenticatedUserInformation.token,
                });
            }, next);
        })
    );


    router.delete(
        "/api/sessions",
        userLoggedInAuthMiddlewareWithoutTokenRefresh,
        asyncHandler(async (_req, res, next) => {
            errorHandlerMiddlewareFactory.catchToErrorHandlerMiddleware(async () => {
                const authenticatedUserInformation = res.locals
                    .authenticatedUserInformation as AuthenticatedUserInformation;
                await tokenManagementOperator.blacklistToken(authenticatedUserInformation.token);
                res.clearCookie(NODE_LOAD_AUTH_COOKIE_NAME).json({});
            }, next);
        })
    );

    return router;
}

injected(
    getSessionsRouter,
    TOKEN_MANAGEMENT_OPERATOR_TOKEN,
    USER_PASSWORD_MANAGEMENT_OPERATOR_TOKEN,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    ERROR_HANDLER_MIDDLEWARE_FACTORY_TOKEN
);

export const SESSIONS_ROUTER_TOKEN = token<express.Router>("SessionsRouter");