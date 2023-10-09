import 'dotenv/config'
import { join } from 'path';
import 'reflect-metadata'
import { DataSource } from "typeorm"
import { config } from './config';

// Decodifique a variável de ambiente com o certificado .pem
const sslCert = process.env.SSL_CERTIFICATE ? Buffer.from(process.env.SSL_CERTIFICATE, 'base64').toString() : undefined;

const port = process.env.DB_PORT as number | undefined

const environment = process.env.ENVIRONMENT

export const AppDataSource = new DataSource({
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
    entities: environment === "local" ? [`${__dirname}/**/entities/*.{ts, js}`] : [join(__dirname, '../dist/**/entities/*.{ts,js}')] , // Ajuste o caminho das entidades para a pasta dist
    migrations: environment === "local" ? [`${__dirname}/**/migrations/*.{ts, js}`] : [join(__dirname, '../dist/**/migrations/*.{ts,js}')], // Ajuste o caminho das migrações para a pasta dist
})