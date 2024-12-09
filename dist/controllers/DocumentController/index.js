"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../config");
const api_errors_1 = require("../../helpers/api-errors");
const categoryRepository_1 = require("../../repositories/categoryRepository");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const documentRepository_1 = require("../../repositories/documentRepository");
const firebaseStorage_1 = require("../../provider/firebaseStorage");
const fs_extra_1 = __importDefault(require("fs-extra"));
class DocumentController {
    async create(req, res) {
        var _a, _b;
        const { category_id, congregation_id } = req.body;
        const file = req.file;
        const category = await categoryRepository_1.categoryRepository.findOneBy({ id: category_id });
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!category) {
            throw new api_errors_1.BadRequestError('Category not exists');
        }
        if (!congregation) {
            throw new api_errors_1.BadRequestError('Congregation not exists');
        }
        if (!file) {
            throw new api_errors_1.NotFoundError('Any file found');
        }
        switch (config_1.config.storage_type) {
            case 'local':
                fs_extra_1.default.move(`./tmp/uploads/${(_a = req.file) === null || _a === void 0 ? void 0 : _a.filename}`, `./tmp/uploads/documents/${congregation.number}/${(_b = req.file) === null || _b === void 0 ? void 0 : _b.filename}`, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
                res.status(201).json({ message: 'Moved' });
                break;
            case 'firebase':
                await (0, firebaseStorage_1.firebaseUpload)(req, res, `documents/${congregation.number}`, saveBD);
                break;
            default:
                res.send('Storage local type is not defined at .env');
                break;
        }
        async function saveBD(file) {
            const { fileName, size, key, url } = file;
            const newDocument = documentRepository_1.documentRepository.create({
                //@ts-expect-error
                fileName: Buffer.from(fileName, 'latin1').toString('utf8'),
                size,
                key,
                url,
                congregation,
                category
            });
            await documentRepository_1.documentRepository.save(newDocument);
            res.status(201).json(newDocument);
        }
    }
    async filter(req, res) {
        const { congregation_id } = req.params;
        const documents = await documentRepository_1.documentRepository.find({
            where: {
                congregation: {
                    id: congregation_id
                }
            }
        });
        if (!documents) {
            throw new api_errors_1.BadRequestError('Document not found!');
        }
        const documentMap = documents.map(doc => {
            const { id, fileName, size, key, url, category } = doc;
            return {
                id,
                fileName,
                size,
                key,
                url,
                category: {
                    id: category.id,
                    name: category.name,
                    description: category.description
                }
            };
        });
        return res.status(200).json(documentMap);
    }
    async delete(req, res) {
        const { document_id } = req.params;
        const document = await documentRepository_1.documentRepository.findOneBy({ id: document_id });
        if (!document) {
            throw new api_errors_1.NotFoundError('Document not found');
        }
        await (0, firebaseStorage_1.deleteFirebase)(document.key);
        await documentRepository_1.documentRepository.remove(document);
        return res.status(200).end();
    }
}
exports.default = new DocumentController();
