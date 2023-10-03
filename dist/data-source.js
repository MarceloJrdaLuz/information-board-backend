"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("dotenv/config");
const path_1 = require("path");
require("reflect-metadata");
const typeorm_1 = require("typeorm");
// Decodifique a variável de ambiente com o certificado .pem
const sslCert = process.env.SSL_CERTIFICATE ? Buffer.from(process.env.SSL_CERTIFICATE, 'base64').toString() : undefined;
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
            rejectUnauthorized: true,
            ca: sslCert,
        }
        : undefined,
    entities: [(0, path_1.join)(__dirname, '../dist/**/entities/*.{ts,js}')],
    migrations: [(0, path_1.join)(__dirname, '../dist/**/migrations/*.{ts,js}')], // Ajuste o caminho das migrações para a pasta dist
    // entities: [`${__dirname}/**/entities/*.{ts, js}`],
    // migrations: [`${__dirname}/**/migrations/*.{ts, js}`]
});
