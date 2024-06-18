import { injected, token } from "brandi";
import express from "express";
import asyncHandler from "express-async-handler";
import { DownloadType } from "../../../dataaccess/db";
import { DOWNLOAD_TASK_MANAGEMENT_OPERATOR_TOKEN, DownloadTaskManagementOperator } from "../../../module/download_task";
import {
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    AuthMiddlewareFactory,
    AuthenticatedUserInformation,
    ERROR_HANDLER_MIDDLEWARE_FACTORY_TOKEN,
    ErrorHandlerMiddlewareFactory
} from "../utils";

export function getDownloadTasksRouter(
    downloadTaskManagementOperator: DownloadTaskManagementOperator,
    authMiddlewareFactory: AuthMiddlewareFactory,
    errorHandlerMiddlewareFactory: ErrorHandlerMiddlewareFactory
): express.Router {
    const router = express.Router();

    const userLoggedInAuthMiddleware = authMiddlewareFactory.getAuthMiddleware(() => true, true);

    router.get("/api/download-tasks/:downloadTaskId",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res, next) => {
            errorHandlerMiddlewareFactory.catchToErrorHandlerMiddleware(async () => {
                const downloadTaskId = +req.params.downloadTaskId;
                const downloadTask = await downloadTaskManagementOperator.getDownloadTaskFile(
                    downloadTaskId
                );
                res.json({ downloadTask });
            }, next);
        })
    );

    router.post("/api/download-tasks",
        userLoggedInAuthMiddleware,
        asyncHandler(async (req, res, next) => {
            errorHandlerMiddlewareFactory.catchToErrorHandlerMiddleware(async () => {
                const authenticatedUserInfo = res.locals.authenticatedUserInformation as AuthenticatedUserInformation;
                const downloadType = +req.body.download_type;
                const url = req.body.url as string;
                const downloadTask = await downloadTaskManagementOperator.createDownloadTask(
                    authenticatedUserInfo.user.id,
                    downloadType as DownloadType,
                    url
                );
                res.json({ downloadTask });
            }, next);
        })
    );

    return router;
}

injected(
    getDownloadTasksRouter,
    DOWNLOAD_TASK_MANAGEMENT_OPERATOR_TOKEN,
    AUTH_MIDDLEWARE_FACTORY_TOKEN,
    ERROR_HANDLER_MIDDLEWARE_FACTORY_TOKEN
);

export const DOWNLOAD_TASKS_ROUTER_TOKEN = token<express.Router>("DownloadTasksRouter");