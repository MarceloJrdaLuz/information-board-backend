"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGitHubCron = void 0;
const config_1 = require("../config");
function verifyGitHubCron(req, res, next) {
    var _a, _b, _c;
    const authHeader = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.trim();
    const expected = `Bearer ${config_1.config.cron_secret_github}`.trim();
    // DEBUG: log seguro no console
    console.log("GitHub Cron request received");
    console.log("AuthHeader length:", authHeader === null || authHeader === void 0 ? void 0 : authHeader.length);
    console.log("Expected length:", expected.length);
    console.log("First 5 chars received:", authHeader === null || authHeader === void 0 ? void 0 : authHeader.slice(0, 5));
    console.log("First 5 chars expected:", expected.slice(0, 5));
    // DEBUG opcional: retornar info segura direto na resposta (apenas para teste)
    // remove ou comente depois que confirmar que funciona
    if (authHeader !== expected) {
        return res.status(401).json({
            message: 'GitHub Cron secret invalid',
            received_length: (_b = authHeader === null || authHeader === void 0 ? void 0 : authHeader.length) !== null && _b !== void 0 ? _b : 0,
            expected_length: expected.length,
            first_chars_received: (_c = authHeader === null || authHeader === void 0 ? void 0 : authHeader.slice(0, 5)) !== null && _c !== void 0 ? _c : '',
            first_chars_expected: expected.slice(0, 5)
        });
    }
    return next();
}
exports.verifyGitHubCron = verifyGitHubCron;
