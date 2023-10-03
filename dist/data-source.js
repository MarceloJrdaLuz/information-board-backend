"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("dotenv/config");
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const config_1 = require("./config");
// Decodifique a variável de ambiente com o certificado .pem
const sslCert = config_1.config.ssl_certificate ? Buffer.from(config_1.config.ssl_certificate, 'base64').toString() : undefined;
const port = process.env.DB_PORT;
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: port,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: sslCert
        ? {
            rejectUnauthorized: false,
            ca: sslCert,
        }
        : undefined,
    entities: [`${__dirname}/**/entities/*.{ts, js}`],
    migrations: [`${__dirname}/**/migrations/*.{ts, js}`]
});
