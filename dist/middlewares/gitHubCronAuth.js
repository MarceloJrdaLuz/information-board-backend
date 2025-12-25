"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGitHubCron = void 0;
const config_1 = require("../config");
const api_errors_1 = require("../helpers/api-errors");
function verifyGitHubCron(req, res, next) {
    var _a;
    const authHeader = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.trim();
    const expected = `Bearer ${config_1.config.cron_secret_github}`.trim();
    if (authHeader !== expected) {
        throw new api_errors_1.UnauthorizedError('GitHub Cron secret invalid');
    }
    return next();
}
exports.verifyGitHubCron = verifyGitHubCron;
