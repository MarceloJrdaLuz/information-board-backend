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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
/**
* Config file
*/
exports.config = {
    app_url: (_a = process.env.APP_URL) !== null && _a !== void 0 ? _a : "",
    storage_type: (_b = process.env.STORAGE_TYPE) !== null && _b !== void 0 ? _b : "",
    nodemailer_host: (_c = process.env.NODEMAILER_HOST) !== null && _c !== void 0 ? _c : "",
    nodemailer_port: (_d = process.env.NODEMAILER_PORT) !== null && _d !== void 0 ? _d : "",
    nodemailer_user: (_e = process.env.NODEMAILER_USER) !== null && _e !== void 0 ? _e : "",
    nodemailer_pass: (_f = process.env.NODEMAILER_PASS) !== null && _f !== void 0 ? _f : "",
    db_certifate: (_g = process.env.DB_CERTIFICATE) !== null && _g !== void 0 ? _g : "",
    google_storage_key: (_h = process.env.GOOGLE_STORAGE_KEY) !== null && _h !== void 0 ? _h : "",
    environment: (_j = process.env.ENVIRONMENT) !== null && _j !== void 0 ? _j : "",
    cron_secret: (_k = process.env.CRON_SECRET) !== null && _k !== void 0 ? _k : "",
    cron_secret_github: (_l = process.env.CRON_SECRET_GITHUB) !== null && _l !== void 0 ? _l : "",
    db_user: (_m = process.env.DB_USER) !== null && _m !== void 0 ? _m : "",
    db_host: (_o = process.env.DB_HOST) !== null && _o !== void 0 ? _o : "",
    db_port: (_p = process.env.DB_PORT) !== null && _p !== void 0 ? _p : "",
    db_name: (_q = process.env.DB_NAME) !== null && _q !== void 0 ? _q : "",
    db_pass: (_r = process.env.DB_PASS) !== null && _r !== void 0 ? _r : "",
    email_backup: (_s = process.env.EMAIL_BACKUP) !== null && _s !== void 0 ? _s : "",
    vercel_token: (_t = process.env.VERCEL_TOKEN) !== null && _t !== void 0 ? _t : ""
};
