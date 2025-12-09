import { NextFunction, Request, Response } from "express";
import { config } from "../config";
import { UnauthorizedError } from "../helpers/api-errors";

export function verifyGitHubCron(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization?.trim();
    const expected = `Bearer ${config.cron_secret_github}`.trim();

    if (authHeader !== expected) {
        throw new UnauthorizedError('GitHub Cron secret invalid');
    }
    return next();
}

