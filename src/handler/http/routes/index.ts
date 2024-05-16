import { Container, token } from "brandi";
import express from "express";
import { DOWNLOAD_TASKS_ROUTER_TOKEN, getDownloadTasksRouter } from "./download_tasks";
import { SESSIONS_ROUTER_TOKEN, getSessionsRouter } from "./sessions";
import { USERS_ROUTER_TOKEN, getUsersRouter } from "./users";

export const ROUTES_TOKEN = token<express.Router[]>("Routes");

export function bindToContainer(container: Container): void {
    container.bind(SESSIONS_ROUTER_TOKEN).toInstance(getSessionsRouter).inSingletonScope();
    container.bind(USERS_ROUTER_TOKEN).toInstance(getUsersRouter).inSingletonScope();
    container.bind(DOWNLOAD_TASKS_ROUTER_TOKEN).toInstance(getDownloadTasksRouter).inSingletonScope();

    container
        .bind(ROUTES_TOKEN)
        .toInstance(() => [
            container.get(SESSIONS_ROUTER_TOKEN),
            container.get(USERS_ROUTER_TOKEN),
            container.get(DOWNLOAD_TASKS_ROUTER_TOKEN)
        ])
        .inSingletonScope();
}