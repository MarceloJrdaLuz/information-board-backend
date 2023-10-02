"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Client = exports.s3Config = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const config_1 = require("../config");
exports.s3Config = {
    region: config_1.config.aws_default_region,
    credentials: {
        accessKeyId: config_1.config.aws_access_key_id,
        secretAccessKey: config_1.config.aws_secret_access_key
    }
};
exports.s3Client = new client_s3_1.S3Client(exports.s3Config);
