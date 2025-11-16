"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const config_1 = require("../../config");
const Congregation_1 = require("../../entities/Congregation");
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
const permissions_1 = require("../../middlewares/permissions");
const firebaseStorage_1 = require("../../provider/firebaseStorage");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const groupRepository_1 = require("../../repositories/groupRepository");
const userRepository_1 = require("../../repositories/userRepository");
const speakerRepository_1 = require("../../repositories/speakerRepository");
const typeorm_1 = require("typeorm");
class CongregationController {
    async create(req, res) {
        var _a, _b;
        const { name, number, city, circuit, image_url } = req.body;
        const file = req.file;
        const congExists = await congregationRepository_1.congregationRepository.findOne({
            where: [
                { number },
                { name, city } // verifica se já existe name + city
            ]
        });
        if (congExists) {
            if (congExists.number === number) {
                throw new api_errors_1.BadRequestError(`A congregation with number "${number}" already exists.`);
            }
            else {
                throw new api_errors_1.BadRequestError(`A congregation with name "${name}" already exists in city "${city}".`);
            }
        }
        if (congExists) {
            throw new api_errors_1.BadRequestError('Congregation already exists');
        }
        if (!file) {
            saveBD(null);
        }
        if (file) {
            switch (config_1.config.storage_type) {
                case 'local':
                    fs_extra_1.default.move(`./tmp/uploads/${(_a = req.file) === null || _a === void 0 ? void 0 : _a.filename}`, `./tmp/uploads/image-home/${number}/${(_b = req.file) === null || _b === void 0 ? void 0 : _b.filename}`, function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                    console.log('Moved');
                    saveBD(null);
                    break;
                case 'firebase':
                    await (0, firebaseStorage_1.firebaseUpload)(req, res, `image-home/${number}`, saveBD);
                    break;
                default:
                    res.send('Storage local type is not defined at .env');
                    break;
            }
        }
        async function saveBD(file) {
            var _a;
            const newCongregation = congregationRepository_1.congregationRepository.create({
                name,
                number,
                city,
                circuit,
                type: Congregation_1.CongregationType.SYSTEM,
                image_url: (_a = file === null || file === void 0 ? void 0 : file.url) !== null && _a !== void 0 ? _a : "",
                imageKey: file === null || file === void 0 ? void 0 : file.key
            });
            await congregationRepository_1.congregationRepository.save(newCongregation).then(() => {
                return res.status(201).send(newCongregation);
            }).catch(err => {
                console.log(err);
                return res.status(500).send({ message: 'Internal server error, checks the logs' });
            });
        }
    }
    async delete(req, res) {
        const { id } = req.params;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id });
        if (!congregation) {
            throw new api_errors_1.NotFoundError('Congregation not found');
        }
        await congregationRepository_1.congregationRepository.remove(congregation);
        return res.status(200).end();
    }
    async update(req, res) {
        const { name, circuit, city, dayMeetingLifeAndMinistary, dayMeetingPublic, hourMeetingLifeAndMinistary, hourMeetingPublic } = req.body;
        const { congregation_id } = req.params;
        if (!congregation_id)
            new api_errors_1.BadRequestError("Congregation Id does not provided");
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation)
            new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        const existingCongregation = await congregationRepository_1.congregationRepository.findOne({
            where: {
                name, city
            }
        });
        if (existingCongregation) {
            throw new api_errors_1.BadRequestError(`A congregation with name "${name}" already exists in city "${city}".`);
        }
        if (congregation) {
            congregation.name = name !== null && name !== void 0 ? name : congregation === null || congregation === void 0 ? void 0 : congregation.name;
            congregation.circuit = circuit !== null && circuit !== void 0 ? circuit : congregation === null || congregation === void 0 ? void 0 : congregation.circuit;
            congregation.city = city !== null && city !== void 0 ? city : congregation === null || congregation === void 0 ? void 0 : congregation.city;
            congregation.dayMeetingLifeAndMinistary = dayMeetingLifeAndMinistary !== null && dayMeetingLifeAndMinistary !== void 0 ? dayMeetingLifeAndMinistary : congregation === null || congregation === void 0 ? void 0 : congregation.dayMeetingLifeAndMinistary;
            congregation.hourMeetingLifeAndMinistary = hourMeetingLifeAndMinistary !== null && hourMeetingLifeAndMinistary !== void 0 ? hourMeetingLifeAndMinistary : congregation === null || congregation === void 0 ? void 0 : congregation.hourMeetingLifeAndMinistary;
            congregation.dayMeetingPublic = dayMeetingPublic !== null && dayMeetingPublic !== void 0 ? dayMeetingPublic : congregation === null || congregation === void 0 ? void 0 : congregation.dayMeetingPublic;
            congregation.hourMeetingPublic = hourMeetingPublic !== null && hourMeetingPublic !== void 0 ? hourMeetingPublic : congregation === null || congregation === void 0 ? void 0 : congregation.hourMeetingPublic;
            congregation.type = Congregation_1.CongregationType.SYSTEM;
            await congregationRepository_1.congregationRepository.save(congregation).then(suc => {
                return res.status(201).json(suc);
            }).catch(err => {
                console.log(err);
                return res.status(500).json({ message: 'Error saving to database' });
            });
        }
    }
    async uploadCongregationPhoto(req, res) {
        var _a, _b;
        const { congregation_id } = req.params;
        const image = req.file;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        if (!image)
            throw new api_errors_1.BadRequestError('Any image provided');
        switch (config_1.config.storage_type) {
            case 'local':
                fs_extra_1.default.move(`./tmp/uploads/${(_a = req.file) === null || _a === void 0 ? void 0 : _a.filename}`, `./tmp/uploads/image-home/${congregation.number}/${(_b = req.file) === null || _b === void 0 ? void 0 : _b.filename}`, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
                console.log('Moved');
                saveBD(null);
                break;
            case 'firebase':
                await (0, firebaseStorage_1.firebaseUpload)(req, res, `image-home/${congregation.number}`, saveBD);
                break;
            default:
                res.send('Storage local type is not defined at .env');
                break;
        }
        async function saveBD(file) {
            var _a, _b;
            if (congregation) {
                if (congregation === null || congregation === void 0 ? void 0 : congregation.imageKey) {
                    await (0, firebaseStorage_1.deleteFirebase)(congregation === null || congregation === void 0 ? void 0 : congregation.imageKey);
                }
                congregation.image_url = (_a = file === null || file === void 0 ? void 0 : file.url) !== null && _a !== void 0 ? _a : "";
                congregation.imageKey = (_b = file === null || file === void 0 ? void 0 : file.key) !== null && _b !== void 0 ? _b : "";
                await congregationRepository_1.congregationRepository.save(congregation).then(suc => {
                    return res.status(201).json(suc);
                }).catch(err => {
                    console.log(err);
                    return res.status(500).json({ message: 'Error saving to database' });
                });
            }
        }
    }
    async list(req, res) {
        const requestByUserId = await (0, permissions_1.decoder)(req);
        const congregationsResponse = [];
        if (requestByUserId && requestByUserId.roles && requestByUserId.roles[0] && requestByUserId.roles[0].name === 'ADMIN_CONGREGATION') {
            const requestUser = await userRepository_1.userRepository.findOne({
                where: {
                    id: requestByUserId.id
                }
            });
            if (requestUser) {
                const cong = await congregationRepository_1.congregationRepository.findOne({
                    where: {
                        id: requestUser.congregation.id
                    }
                });
                if (cong)
                    congregationsResponse.push(cong);
            }
        }
        if (requestByUserId && requestByUserId.roles && requestByUserId.roles[0] && requestByUserId.roles[0].name === 'ADMIN') {
            const congExists = await congregationRepository_1.congregationRepository.find({
                where: {
                    type: Congregation_1.CongregationType.SYSTEM
                }
            });
            if (congExists)
                congregationsResponse.push(...congExists);
        }
        if (!congregationsResponse) {
            throw new api_errors_1.NotFoundError('Congregations not found');
        }
        return res.status(200).json(congregationsResponse);
    }
    async getCongregationSystemToTransferPublisher(req, res) {
        const congregations = await congregationRepository_1.congregationRepository.find({
            where: {
                type: Congregation_1.CongregationType.SYSTEM
            },
            select: ["name", "city", "circuit", "id"]
        });
        res.status(200).json(congregations);
    }
    async getCongregation(req, res) {
        const { number } = req.params;
        const congExists = await congregationRepository_1.congregationRepository.findOne({
            where: {
                number,
                type: Congregation_1.CongregationType.SYSTEM
            },
        });
        if (!congExists) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        }
        const groups = await groupRepository_1.groupRepository.find({
            where: {
                congregation: {
                    id: congExists.id
                }
            }, select: ["id", "name", "number"]
        });
        return res.status(200).json({ ...congExists, groups });
    }
    async getAuxiliaryCongregations(req, res) {
        const requestByUserId = await (0, permissions_1.decoder)(req);
        const requestUser = await userRepository_1.userRepository.findOne({
            where: {
                id: requestByUserId.id
            }
        });
        if (requestUser) {
            const congregations = await congregationRepository_1.congregationRepository.find({
                where: {
                    type: Congregation_1.CongregationType.AUXILIARY,
                    creatorCongregation: {
                        id: requestUser.congregation.id
                    }
                }
            });
            let speakers = [];
            const congregationIds = congregations.map(c => c.id);
            if (congregationIds.length > 0) {
                speakers = await speakerRepository_1.speakerRepository.find({
                    where: {
                        originCongregation: { id: (0, typeorm_1.In)(congregationIds) }
                    },
                    relations: ["originCongregation"]
                });
            }
            //  Mapear os speakers para a congregação correspondente
            const congregationsWithSpeakers = congregations.map(c => ({
                ...c,
                speakers: speakers.filter(s => s.originCongregation.id === c.id)
            }));
            return res.status(200).json(congregationsWithSpeakers);
        }
    }
    async createAuxiliaryCongregation(req, res) {
        const { name, number, city, circuit, dayMeetingPublic, hourMeetingPublic } = req.body;
        const requestUser = await (0, permissions_1.decoder)(req);
        const userReq = await userRepository_1.userRepository.findOne({
            where: {
                id: requestUser.id
            }
        });
        const congExists = await congregationRepository_1.congregationRepository.findOne({
            where: [
                { number },
                { name, city }
            ]
        });
        if (congExists) {
            if (congExists.number === number) {
                throw new api_errors_1.BadRequestError(`A congregation with number "${number}" already exists.`);
            }
            else {
                throw new api_errors_1.BadRequestError(`A congregation with name "${name}" already exists in city "${city}".`);
            }
        }
        if (congExists) {
            throw new api_errors_1.BadRequestError('Congregation already exists');
        }
        const newCongregation = congregationRepository_1.congregationRepository.create({
            name,
            number,
            city,
            circuit,
            type: Congregation_1.CongregationType.AUXILIARY,
            dayMeetingPublic,
            hourMeetingPublic,
            creatorCongregation: userReq === null || userReq === void 0 ? void 0 : userReq.congregation
        });
        await congregationRepository_1.congregationRepository.save(newCongregation);
        res.status(201).send(newCongregation);
    }
    async updateAuxiliaryCongregation(req, res) {
        const { congregation_id } = req.params;
        const { name, number, city, circuit, dayMeetingPublic, hourMeetingPublic } = req.body;
        const requestUser = await (0, permissions_1.decoder)(req);
        const userReq = await userRepository_1.userRepository.findOne({
            where: {
                id: requestUser.id
            }
        });
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation) {
            throw new api_errors_1.BadRequestError(messageErrors_1.messageErrors.notFound.congregation);
        }
        const existingCongregation = await congregationRepository_1.congregationRepository.findOne({
            where: [
                { number },
                { name, city }
            ]
        });
        if (existingCongregation && existingCongregation.id !== congregation_id) {
            if (existingCongregation.number === number) {
                throw new api_errors_1.BadRequestError(`A congregation with number "${number}" already exists.`);
            }
            else {
                throw new api_errors_1.BadRequestError(`A congregation with name "${name}" already exists in city "${city}".`);
            }
        }
        congregation.name = name !== null && name !== void 0 ? name : congregation.name;
        congregation.number = number !== null && number !== void 0 ? number : congregation.number;
        congregation.city = city !== null && city !== void 0 ? city : congregation.city;
        congregation.circuit = circuit !== null && circuit !== void 0 ? circuit : congregation.circuit;
        congregation.type = congregation.type;
        congregation.dayMeetingPublic = dayMeetingPublic !== null && dayMeetingPublic !== void 0 ? dayMeetingPublic : congregation.dayMeetingPublic;
        congregation.hourMeetingPublic = hourMeetingPublic !== null && hourMeetingPublic !== void 0 ? hourMeetingPublic : congregation.hourMeetingPublic;
        await congregationRepository_1.congregationRepository.save(congregation);
        res.status(201).send(congregation);
    }
    async deleteAuxiliaryCongregation(req, res) {
        const { congregation_id: id } = req.params;
        const requestByUserId = await (0, permissions_1.decoder)(req);
        const requestUser = await userRepository_1.userRepository.findOne({
            where: {
                id: requestByUserId.id
            }
        });
        if (requestUser) {
            const congregation = await congregationRepository_1.congregationRepository.findOne({
                where: {
                    id,
                    type: Congregation_1.CongregationType.AUXILIARY,
                    creatorCongregation: {
                        id: requestUser.congregation.id
                    }
                }
            });
            if (!congregation) {
                throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
            }
            await congregationRepository_1.congregationRepository.remove(congregation);
        }
        return res.status(200).end();
    }
}
exports.default = new CongregationController();
