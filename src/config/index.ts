import * as dotenv from 'dotenv';

dotenv.config();

/**
* Config file
*/
export const config: {
    app_url: string,
    storage_type: string,
    nodemailer_host: string,
    nodemailer_user: string,
    nodemailer_pass: string,
    nodemailer_port: string
    db_certifate: string,
    google_storage_key: string,
    environment: string, 
    cron_secret: string
} = {
    app_url: process.env.APP_URL ?? "",
    storage_type: process.env.STORAGE_TYPE ?? "",
    nodemailer_host: process.env.NODEMAILER_HOST ?? "",
    nodemailer_port: process.env.NODEMAILER_PORT ?? "",
    nodemailer_user: process.env.NODEMAILER_USER ?? "",
    nodemailer_pass: process.env.NODEMAILER_PASS ?? "",
    db_certifate: process.env.DB_CERTIFICATE ?? "",
    google_storage_key: process.env.GOOGLE_STORAGE_KEY ?? "",
    environment: process.env.ENVIRONMENT ?? "", 
    cron_secret: process.env.CRON_SECRET ?? ""
}