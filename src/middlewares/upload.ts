import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextFunction, Request, Response } from "express-serve-static-core";
import { Readable } from "stream";
import { v4 } from "uuid";
import { config } from "../config";
import { s3Client } from "../config/multer";

export async function uploadToS3(req: Request, res: Response, next: NextFunction) {
    const fileStream = new Readable();
    fileStream._read = () => { };
    //@ts-expect-error
    fileStream.push(req.file.buffer);
    fileStream.push(null);

    const params = {
        Bucket: config.bucket_name,
        Key: `${v4()}-${req.file?.originalname}`
    }

    try {
        const command = new PutObjectCommand({
            ...params,
            Body: fileStream,
                //@ts-expect-error
            ContentLength: req.file.size,
        });
        const data = await s3Client.send(command);
        console.log('Arquivo carregado com sucesso:', data);

        next()
    } catch (err) {
        console.log('Erro ao carregar arquivo:', err);
    }
}
