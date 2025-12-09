import 'dotenv/config'
import { join } from 'path';
import 'reflect-metadata'
import { DataSource } from "typeorm"
import { config } from './config';

// Decodifique a variável de ambiente com o certificado .pem
const sslCert = process.env.SSL_CERTIFICATE ? Buffer.from(process.env.SSL_CERTIFICATE, 'base64').toString() : undefined;

const port = process.env.DB_PORT as number | undefined

const environment = process.env.ENVIRONMENT

// Mantemos o mesmo nome AppDataSource, mas com inicialização única
let _AppDataSource: DataSource | null = null;

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
    entities: environment === "local"
        ? [`${__dirname}/**/entities/*.{ts, js}`]
        : [join(__dirname, '../dist/**/entities/*.{ts,js}')],
    migrations: environment === "local"
        ? [`${__dirname}/**/migrations/*.{ts, js}`]
        : [join(__dirname, '../dist/**/migrations/*.{ts,js}')],
    extra: {
        max: 10, // limite de conexões no pool
    },
});

// Função para inicializar o DataSource uma única vez
export const initializeAppDataSource = async () => {
    if (!_AppDataSource) {
        _AppDataSource = await AppDataSource.initialize();
        console.log("✅ AppDataSource initialized");
    }
    return _AppDataSource;
};