"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.is = exports.requirePublisher = exports.verifyCronSecret = exports.decoder = void 0;
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const process_1 = __importDefault(require("process"));
const config_1 = require("../config");
const api_errors_1 = require("../helpers/api-errors");
const userRepository_1 = require("../repositories/userRepository");
async function decoder(request) {
    var _a, _b, _c, _d;
    const authHeader = request.headers.authorization;
    if (!authHeader) {
        throw new api_errors_1.UnauthorizedError('No token provided');
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
        throw new api_errors_1.UnauthorizedError('Token Error');
    }
    const [scheme, token] = parts;
    if (!/^Bearer$/i.test(scheme)) {
        throw new api_errors_1.UnauthorizedError('Token malformatted');
    }
    const jwtPass = (_a = process_1.default.env.JWT_PASS) !== null && _a !== void 0 ? _a : "";
    jsonwebtoken_1.default.verify(token, jwtPass, (err, decoded) => {
        if (err) {
            throw new api_errors_1.UnauthorizedError('Token invalid');
        }
    });
    const payload = (0, jsonwebtoken_1.decode)(token);
    const user = await userRepository_1.userRepository.findOne({
        where: { id: (_b = payload === null || payload === void 0 ? void 0 : payload.sub) === null || _b === void 0 ? void 0 : _b.toString() },
        relations: ['publisher']
    });
    if (!user) {
        throw new api_errors_1.UnauthorizedError("User not found");
    }
    return {
        id: user.id,
        roles: user.roles,
        publisher_id: (_d = (_c = user.publisher) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : null
    };
}
exports.decoder = decoder;
function verifyCronSecret(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${config_1.config.cron_secret}`) {
        throw new api_errors_1.UnauthorizedError('Cron secret invalid');
    }
    return next();
}
exports.verifyCronSecret = verifyCronSecret;
function requirePublisher() {
    return async (req, res, next) => {
        const user = await decoder(req);
        if (!user.publisher_id) {
            throw new api_errors_1.UnauthorizedError("User is not linked to a publisher");
        }
        return next();
    };
}
exports.requirePublisher = requirePublisher;
function is(role) {
    const roleAuthorized = async (req, res, next) => {
        var _a;
        const user = await decoder(req);
        // pega do body ou dos params
        const congregation_id = req.body.congregation_id || req.params.id;
        const userRoles = (_a = user === null || user === void 0 ? void 0 : user.roles) === null || _a === void 0 ? void 0 : _a.map(role => role.name);
        const rolesExists = userRoles === null || userRoles === void 0 ? void 0 : userRoles.some(r => role.includes(r));
        if (rolesExists) {
            if (userRoles === null || userRoles === void 0 ? void 0 : userRoles.includes("ADMIN")) {
                return next();
            }
            else {
                // se for admin_congregation, precisa pertencer à congregação
                const userCongregation = await userRepository_1.userRepository.find({
                    where: {
                        id: user.id,
                        congregation: { id: congregation_id }
                    }
                });
                if (userCongregation.length < 1) {
                    throw new api_errors_1.UnauthorizedError('User is not admin in this congregation');
                }
                return next();
            }
        }
        throw new api_errors_1.UnauthorizedError('Unauthorized');
    };
    return roleAuthorized;
}
exports.is = is;
