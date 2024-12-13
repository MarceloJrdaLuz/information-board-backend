"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const config_1 = require("../../config");
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
const firebaseStorage_1 = require("../../provider/firebaseStorage");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const territoryRepository_1 = require("../../repositories/territoryRepository");
class TerritoryController {
    async create(req, res) {
        var _a, _b;
        const { congregation_id } = req.params;
        const { name, description } = req.body;
        const file = req.file;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation) {
            throw new api_errors_1.BadRequestError(messageErrors_1.messageErrors.notFound.congregation);
        }
        const territoryAlreadyExist = await territoryRepository_1.territoryRepository.findOne({
            where: {
                name,
                congregation: {
                    id: congregation.id
                }
            }
        });
        if (territoryAlreadyExist) {
            throw new api_errors_1.BadRequestError('Territory duplicated in this congregation');
        }
        if (file) {
            switch (config_1.config.storage_type) {
                case 'local':
                    fs_extra_1.default.move(`./tmp/uploads/${(_a = req.file) === null || _a === void 0 ? void 0 : _a.filename}`, `./tmp/uploads/territories/${(_b = req.file) === null || _b === void 0 ? void 0 : _b.filename}`, function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                    console.log('moved');
                    saveBD(null);
                    break;
                case 'firebase':
                    await (0, firebaseStorage_1.firebaseUpload)(req, res, `territories/${congregation.number}`, saveBD);
                    break;
                default:
                    res.send('Storage local type is not defined at .env');
                    break;
            }
        }
        else
            saveBD(null);
        async function saveBD(file) {
            var _a, _b;
            if (congregation) {
                const newTerritory = territoryRepository_1.territoryRepository.create({
                    name,
                    description,
                    image_url: (_a = file === null || file === void 0 ? void 0 : file.url) !== null && _a !== void 0 ? _a : "",
                    key: (_b = file === null || file === void 0 ? void 0 : file.key) !== null && _b !== void 0 ? _b : "",
                    congregation
                });
                await territoryRepository_1.territoryRepository.save(newTerritory).then(async () => {
                    await territoryRepository_1.territoryRepository.save(newTerritory);
                    return res.status(201).json(newTerritory);
                }).catch(err => {
                    console.log(err);
                    return res.status(500).send({ message: 'Internal server error, checks the logs' });
                });
            }
        }
    }
    async update(req, res) {
        var _a, _b;
        const { territory_id: id } = req.params;
        const { description, name } = req.body;
        console.log(description, name, id);
        const file = req.file;
        const territory = await territoryRepository_1.territoryRepository.findOneBy({ id });
        if (!territory) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.territory);
        }
        if (file) {
            switch (config_1.config.storage_type) {
                case 'local':
                    fs_extra_1.default.move(`./tmp/uploads/${(_a = req.file) === null || _a === void 0 ? void 0 : _a.filename}`, `./tmp/uploads/territories/${(_b = req.file) === null || _b === void 0 ? void 0 : _b.filename}`, function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                    console.log('Moved');
                    saveBD(null);
                    break;
                case 'firebase':
                    await (0, firebaseStorage_1.firebaseUpload)(req, res, `territories`, saveBD);
                    break;
                default:
                    res.send('Storage local type is not defined at .env');
                    break;
            }
        }
        else
            saveBD(null);
        async function saveBD(file) {
            var _a, _b;
            if (file) {
                if (territory === null || territory === void 0 ? void 0 : territory.key)
                    await (0, firebaseStorage_1.deleteFirebase)(territory === null || territory === void 0 ? void 0 : territory.key);
            }
            const updateTerritory = {
                name,
                description,
                image_url: (_a = file === null || file === void 0 ? void 0 : file.url) !== null && _a !== void 0 ? _a : territory === null || territory === void 0 ? void 0 : territory.image_url,
                key: (_b = file === null || file === void 0 ? void 0 : file.key) !== null && _b !== void 0 ? _b : territory === null || territory === void 0 ? void 0 : territory.key
            };
            await territoryRepository_1.territoryRepository.save({ id, ...updateTerritory }).then(suc => {
                return res.status(201).json(suc);
            }).catch(err => {
                console.log(err);
                return res.status(500).json({ message: 'Internal server error' });
            });
        }
    }
    async delete(req, res) {
        const { territory_id } = req.params;
        const territory = await territoryRepository_1.territoryRepository.findOneBy({ id: territory_id });
        if (!territory) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.territory);
        }
        if (config_1.config.storage_type !== "local") {
            await (0, firebaseStorage_1.deleteFirebase)(territory.key);
        }
        await territoryRepository_1.territoryRepository.remove(territory).catch(err => console.log(err));
        return res.status(200).end();
    }
    async getTerritory(req, res) {
        const { territory_id: id } = req.params;
        const territory = await territoryRepository_1.territoryRepository.findOneBy({ id });
        if (!territory)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.territory);
        return res.status(200).json(territory);
    }
    async getTerritories(req, res) {
        const { congregation_id } = req.params;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        }
        const territories = await territoryRepository_1.territoryRepository.find({
            where: {
                congregation: {
                    id: congregation.id
                }
            }
        });
        res.send(territories);
    }
}
exports.default = new TerritoryController();
