"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAppDataSource = exports.AppDataSource = void 0;
require("dotenv/config");
const path_1 = require("path");
require("reflect-metadata");
const typeorm_1 = require("typeorm");
// Decodifique a variável de ambiente com o certificado .pem
const sslCert = process.env.SSL_CERTIFICATE ? Buffer.from(process.env.SSL_CERTIFICATE, 'base64').toString() : undefined;
const port = process.env.DB_PORT;
const environment = process.env.ENVIRONMENT;
// Mantemos o mesmo nome AppDataSource, mas com inicialização única
let _AppDataSource = null;
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
    entities: environment === "local"
        ? [`${__dirname}/**/entities/*.{ts, js}`]
        : [(0, path_1.join)(__dirname, '../dist/**/entities/*.{ts,js}')],
    migrations: environment === "local"
        ? [`${__dirname}/**/migrations/*.{ts, js}`]
        : [(0, path_1.join)(__dirname, '../dist/**/migrations/*.{ts,js}')],
    extra: {
        max: 10, // limite de conexões no pool
    },
});
// Função para inicializar o DataSource uma única vez
const initializeAppDataSource = async () => {
    if (!_AppDataSource) {
        _AppDataSource = await exports.AppDataSource.initialize();
        console.log("✅ AppDataSource initialized");
    }
    return _AppDataSource;
};
exports.initializeAppDataSource = initializeAppDataSource;
