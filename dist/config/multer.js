"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const _1 = require(".");
const awsS3_1 = require("../provider/awsS3");
// Faz o upload do arquivo para o bucket
const MAX_SIZE_FILE = 10 * 1024 * 1024;
function choiceStorage(storage) {
    let storageChoice;
    switch (storage) {
        case 'local':
            storageChoice = multer_1.default.diskStorage({
                destination: path_1.default.resolve(__dirname, "..", "..", "tmp", "uploads"),
                filename: (req, file, cb) => {
                    cb(null, `${(0, uuid_1.v4)()}-${file.originalname.trim()}`);
                }
            });
            break;
        case 's3':
            storageChoice =
                (0, multer_s3_1.default)({
                    s3: awsS3_1.s3Client,
                    bucket: _1.config.bucket_name,
                    contentType: multer_s3_1.default.AUTO_CONTENT_TYPE,
                    acl: "public-read",
                    key: (req, file, cb) => {
                        const fileName = `${(0, uuid_1.v4)()}-${file.originalname.trim()}`;
                        cb(null, fileName);
                    }
                });
            break;
        case ('firebase'):
            storageChoice = multer_1.default.memoryStorage();
    }
    return storageChoice;
}
exports.uploadFile = (0, multer_1.default)({
    storage: choiceStorage(_1.config.storage_type),
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
        }
        else {
            cb(new Error("Invalid file type."));
        }
    }
});
