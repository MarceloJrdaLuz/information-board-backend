import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../helpers/api-errors";
import { config } from "../config";

export function verifyGitHubCron(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization?.trim();
    const expected = `Bearer ${config.cron_secret_github}`.trim();

    // DEBUG: log seguro no console
    console.log("GitHub Cron request received");
    console.log("AuthHeader length:", authHeader?.length);
    console.log("Expected length:", expected.length);
    console.log("First 5 chars received:", authHeader?.slice(0, 5));
    console.log("First 5 chars expected:", expected.slice(0, 5));

    // DEBUG opcional: retornar info segura direto na resposta (apenas para teste)
    // remove ou comente depois que confirmar que funciona
    if (authHeader !== expected) {
        return res.status(401).json({
            message: 'GitHub Cron secret invalid',
            received_length: authHeader?.length ?? 0,
            expected_length: expected.length,
            first_chars_received: authHeader?.slice(0, 5) ?? '',
            first_chars_expected: expected.slice(0, 5)
        });
    }

    return next();
}

