import * as dotenv from 'dotenv';

dotenv.config();

/**
* Config file
*/
export const config: {
    app_url: string,
    storage_type: string,
    aws_access_key_id: string,
    aws_secret_access_key: string,
    bucket_name: string,
    aws_default_region: string,
    nodemailer_host: string,
    nodemailer_user: string,
    nodemailer_pass: string,
    nodemailer_port: string

} = {
    app_url: process.env.APP_URL ?? "",
    storage_type: process.env.STORAGE_TYPE ?? "",
    aws_access_key_id: process.env.AWS_ACCESS_KEY_ID_QUADRO ?? " ",
    aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY_QUADRO ?? '',
    bucket_name: process.env.BUCKET_NAME_QUADRO ?? 'test-bucket',
    aws_default_region: process.env.AWS_DEFAULT_REGION_QUADRO ?? "",
    nodemailer_host: process.env.NODEMAILER_HOST ?? "",
    nodemailer_port: process.env.NODEMAILER_PORT ?? "",
    nodemailer_user: process.env.NODEMAILER_USER ?? "",
    nodemailer_pass: process.env.NODEMAILER_PASS ?? ""
}