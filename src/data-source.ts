import 'dotenv/config'
import 'reflect-metadata'
import { DataSource } from "typeorm"
import fs from 'fs';
import { config } from './config';

// Decodifique a variável de ambiente com o certificado .pem
const sslCert = config.ssl_certificate ? Buffer.from(config.ssl_certificate, 'base64').toString() : undefined;

const port = process.env.DB_PORT as number | undefined

export const AppDataSource = new DataSource({
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
})