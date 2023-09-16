import { S3Client } from "@aws-sdk/client-s3";
import { config } from "../config";

export const s3Config = {
    region: config.aws_default_region,
    credentials: {
        accessKeyId: config.aws_access_key_id,
        secretAccessKey: config.aws_secret_access_key
    }
};

export const s3Client = new S3Client(s3Config);