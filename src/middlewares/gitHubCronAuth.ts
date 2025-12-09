import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../helpers/api-errors";
import { config } from "../config";

export function verifyGitHubCron(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization?.trim();
    const expectedSecret = `Bearer ${config.cron_secret_github}`.trim();

    console.log("AuthHeader received from request:", JSON.stringify(authHeader));
    console.log("Expected GitHub secret:", JSON.stringify(expectedSecret));

    if (!authHeader || authHeader !== expectedSecret) {
        throw new UnauthorizedError('GitHub Cron secret invalid');
    }

    return next();
}
