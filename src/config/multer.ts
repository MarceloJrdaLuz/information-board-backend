import multer from 'multer';
import path from 'path';
import { v4 } from 'uuid';
import { config } from '.';

const MAX_SIZE_FILE = 10 * 1024 * 1024;

function choiceStorage(storage: string) {
    let storageChoice;
    switch (storage) {
        case 'local':
            storageChoice = multer.diskStorage({
                destination: path.resolve(__dirname, "..", "..", "tmp", "uploads"),
                filename: (req, file, cb) => {
                    cb(null, `${v4()}-${file.originalname.trim()}`);
                }
            });
            break;
        case 'firebase':
            storageChoice = multer.memoryStorage();
    }
    return storageChoice;
}

export const uploadFile = multer({
    storage: choiceStorage(config.storage_type),
    limits: {
        fileSize: MAX_SIZE_FILE
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            "image/jpeg",
            "image/pjpeg",
            "image/png",
            "image/gif",
            "application/pdf",
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type."));
        }
    }
});

export const uploadXml = multer({
    storage: multer.diskStorage({
        destination: path.resolve(__dirname, "..", "..", "tmp", "uploads"),
        filename: (req, file, cb) => {
            cb(null, `${v4()}-${file.originalname.trim()}`);
        }
    }),
    limits: {
        fileSize: 20 * 1024 * 1024
    }
});
