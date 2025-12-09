"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGitHubCron = void 0;
const api_errors_1 = require("../helpers/api-errors");
const config_1 = require("../config");
function verifyGitHubCron(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${config_1.config.cron_secret_github}`) {
        throw new api_errors_1.UnauthorizedError('GitHub Cron secret invalid');
    }
    return next();
}
exports.verifyGitHubCron = verifyGitHubCron;
