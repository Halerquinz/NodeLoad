import { Container } from "brandi";
import * as downloadTask from ".";

export interface TaskData {
    id: number;
    ctx: downloadTask.DownloadTaskManagementOperator,
    method: string;
}

export default async ({ id, ctx, method }: TaskData): Promise<void> => {
    switch (method) {
        case "executeDownloadTask":
            await ctx.executeDownloadTask(id);
            break;
        default:
            throw new Error("Method not supported");
    }
};