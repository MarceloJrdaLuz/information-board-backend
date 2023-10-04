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
    type: string,
    project_id: string,
    private_key_id: string,
    private_key: string,
    client_email: string,
    client_id: string,
    auth_uri: string,
    token_uri: string,
    auth_provider_x509_cert_url: string,
    client_x509_cert_url: string,
    universe_domain: string,
    db_certifate: string,
    google_storage_key: string,
    ssl_certificate: string
    environment: string
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
    nodemailer_pass: process.env.NODEMAILER_PASS ?? "",
    type: process.env.type ?? "",
    project_id: process.env.project_id ?? "",
    private_key_id: process.env.private_key_id ?? "",
    private_key: process.env.private_key ?? "",
    client_email: process.env.client_email ?? "",
    client_id: process.env.client_id ?? "",
    auth_uri: process.env.auth_uri ?? "",
    token_uri: process.env.token_uri ?? "",
    auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url ?? "",
    client_x509_cert_url: process.env.client_x509_cert_url ?? "",
    universe_domain: process.env.universe_domain ?? "",
    db_certifate: process.env.DB_CERTIFICATE ?? "",
    google_storage_key: process.env.GOOGLE_STORAGE_KEY ?? "",
    ssl_certificate: process.env.SSEL_CERTIFICATE ?? "",
    environment: process.env.ENVIRONMENT ?? ""
}