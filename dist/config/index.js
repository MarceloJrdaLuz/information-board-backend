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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
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
    aws_access_key_id: (_c = process.env.AWS_ACCESS_KEY_ID_QUADRO) !== null && _c !== void 0 ? _c : " ",
    aws_secret_access_key: (_d = process.env.AWS_SECRET_ACCESS_KEY_QUADRO) !== null && _d !== void 0 ? _d : '',
    bucket_name: (_e = process.env.BUCKET_NAME_QUADRO) !== null && _e !== void 0 ? _e : 'test-bucket',
    aws_default_region: (_f = process.env.AWS_DEFAULT_REGION_QUADRO) !== null && _f !== void 0 ? _f : "",
    nodemailer_host: (_g = process.env.NODEMAILER_HOST) !== null && _g !== void 0 ? _g : "",
    nodemailer_port: (_h = process.env.NODEMAILER_PORT) !== null && _h !== void 0 ? _h : "",
    nodemailer_user: (_j = process.env.NODEMAILER_USER) !== null && _j !== void 0 ? _j : "",
    nodemailer_pass: (_k = process.env.NODEMAILER_PASS) !== null && _k !== void 0 ? _k : "",
    type: (_l = process.env.type) !== null && _l !== void 0 ? _l : "",
    project_id: (_m = process.env.project_id) !== null && _m !== void 0 ? _m : "",
    private_key_id: (_o = process.env.private_key_id) !== null && _o !== void 0 ? _o : "",
    private_key: (_p = process.env.private_key) !== null && _p !== void 0 ? _p : "",
    client_email: (_q = process.env.client_email) !== null && _q !== void 0 ? _q : "",
    client_id: (_r = process.env.client_id) !== null && _r !== void 0 ? _r : "",
    auth_uri: (_s = process.env.auth_uri) !== null && _s !== void 0 ? _s : "",
    token_uri: (_t = process.env.token_uri) !== null && _t !== void 0 ? _t : "",
    auth_provider_x509_cert_url: (_u = process.env.auth_provider_x509_cert_url) !== null && _u !== void 0 ? _u : "",
    client_x509_cert_url: (_v = process.env.client_x509_cert_url) !== null && _v !== void 0 ? _v : "",
    universe_domain: (_w = process.env.universe_domain) !== null && _w !== void 0 ? _w : "",
    db_certifate: (_x = process.env.DB_CERTIFICATE) !== null && _x !== void 0 ? _x : "",
    google_storage_key: (_y = process.env.GOOGLE_STORAGE_KEY) !== null && _y !== void 0 ? _y : "",
    ssl_certificate: (_z = process.env.SSEL_CERTIFICATE) !== null && _z !== void 0 ? _z : "",
    environment: (_0 = process.env.ENVIRONMENT) !== null && _0 !== void 0 ? _0 : ""
};
