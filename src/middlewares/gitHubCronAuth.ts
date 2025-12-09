import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../helpers/api-errors";
import { config } from "../config";

export function verifyGitHubCron(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (authHeader !== `Bearer ${config.cron_secret_github}`) {
        throw new UnauthorizedError('GitHub Cron secret invalid');
    }

    return next();
}
