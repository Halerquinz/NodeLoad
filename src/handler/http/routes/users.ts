import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import {
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    AuthMiddlewareFactory,
    ERROR_HANDLER_MIDDLEWARE_FACTORY_TOKEN,
    ErrorHandlerMiddlewareFactory
} from "../utils";
import { UserManagementOperator, USER_MANAGEMENT_OPERATOR_TOKEN } from "../../../module/user";
import { USER_PASSWORD_MANAGEMENT_OPERATOR_TOKEN, UserPasswordManagementOperator } from "../../../module/password";

export function getUsersRouter(
    userManagementOperator: UserManagementOperator,
    userPasswordManagementOperator: UserPasswordManagementOperator,
    authMiddlewareFactory: AuthMiddlewareFactory,
    errorHandlerMiddlewareFactory: ErrorHandlerMiddlewareFactory
): express.Router {
    const router = express.Router();

    const userLoggedInAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(() => true, true);

    router.post("/api/users",
        asyncHandler(async (req, res, next) => {
            errorHandlerMiddlewareFactory.catchToErrorHandlerMiddleware(async () => {
                const username = req.body.username as string;
                const displayName = req.body.display_name as string;
                const password = req.body.password as string;
                const user = await userManagementOperator.createUser(username, displayName);
                const userPassword = await userPasswordManagementOperator.createUserPassword(user.id, password);
                res.json({ user, userPassword });
            }, next);
        })
    );

    router.patch(
        "/api/users/:userId",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res, next) => {
            errorHandlerMiddlewareFactory.catchToErrorHandlerMiddleware(async () => {
                const userId = +req.params.userId;
                const username = req.body.username as string;
                const displayName = req.body.display_name as string;
                const password = req.body.password as string;
                const user = await userManagementOperator.updateUser(userId, username, displayName);
                const userPassword = await userPasswordManagementOperator.updateUserPassword(userId, password);
                res.json({ user, userPassword });
            }, next);
        })
    );

    return router;
}

injected(
    getUsersRouter,
    USER_MANAGEMENT_OPERATOR_TOKEN,
    USER_PASSWORD_MANAGEMENT_OPERATOR_TOKEN,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    ERROR_HANDLER_MIDDLEWARE_FACTORY_TOKEN
);

export const USERS_ROUTER_TOKEN = token<express.Router>("UsersRouter");