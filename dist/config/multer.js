"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadXml = exports.uploadFile = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const _1 = require(".");
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
        case 'firebase':
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
exports.uploadXml = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024
    }
});
