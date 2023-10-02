"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../config");
const api_errors_1 = require("../../helpers/api-errors");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const fs_extra_1 = __importDefault(require("fs-extra"));
const firebaseStorage_1 = require("../../provider/firebaseStorage");
const groupRepository_1 = require("../../repositories/groupRepository");
const messageErrors_1 = require("../../helpers/messageErrors");
const permissions_1 = require("../../middlewares/permissions");
const userRepository_1 = require("../../repositories/userRepository");
class CongregationController {
    async create(req, res) {
        var _a, _b;
        const { name, number, city, image_url, circuit } = req.body;
        const file = req.file;
        const congExists = await congregationRepository_1.congregationRepository.findOneBy({ number });
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
                console.log(requestUser);
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
            const congExists = await congregationRepository_1.congregationRepository.find({});
            if (congExists)
                congregationsResponse.push(...congExists);
        }
        if (!congregationsResponse) {
            throw new api_errors_1.NotFoundError('Congregations not found');
        }
        return res.status(200).json(congregationsResponse);
    }
    async update(req, res) {
        const { name, circuit, city, dayMeetingLifeAndMinistary, dayMeetingPublic, hourMeetingLifeAndMinistary, hourMeetingPublic } = req.body;
        const { congregation_id } = req.params;
        if (!congregation_id)
            new api_errors_1.BadRequestError("Congregation Id does not provided");
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation)
            new api_errors_1.NotFoundError("Congregation does not exists");
        if (congregation) {
            if (congregation.name === name &&
                congregation.circuit === circuit &&
                congregation.city === city &&
                congregation.dayMeetingLifeAndMinistary === dayMeetingLifeAndMinistary &&
                congregation.hourMeetingLifeAndMinistary === `${hourMeetingLifeAndMinistary}:00` &&
                congregation.dayMeetingPublic === dayMeetingPublic &&
                congregation.hourMeetingPublic === `${hourMeetingPublic}:00`) {
                throw new api_errors_1.BadRequestError('Any changes found');
            }
            congregation.name = name !== null && name !== void 0 ? name : congregation === null || congregation === void 0 ? void 0 : congregation.name;
            congregation.circuit = circuit !== null && circuit !== void 0 ? circuit : congregation === null || congregation === void 0 ? void 0 : congregation.circuit;
            congregation.city = city !== null && city !== void 0 ? city : congregation === null || congregation === void 0 ? void 0 : congregation.city;
            congregation.dayMeetingLifeAndMinistary = dayMeetingLifeAndMinistary !== null && dayMeetingLifeAndMinistary !== void 0 ? dayMeetingLifeAndMinistary : congregation === null || congregation === void 0 ? void 0 : congregation.dayMeetingLifeAndMinistary;
            congregation.hourMeetingLifeAndMinistary = hourMeetingLifeAndMinistary !== null && hourMeetingLifeAndMinistary !== void 0 ? hourMeetingLifeAndMinistary : congregation === null || congregation === void 0 ? void 0 : congregation.hourMeetingLifeAndMinistary;
            congregation.dayMeetingPublic = dayMeetingPublic !== null && dayMeetingPublic !== void 0 ? dayMeetingPublic : congregation === null || congregation === void 0 ? void 0 : congregation.dayMeetingPublic;
            congregation.hourMeetingPublic = hourMeetingPublic !== null && hourMeetingPublic !== void 0 ? hourMeetingPublic : congregation === null || congregation === void 0 ? void 0 : congregation.hourMeetingPublic;
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
    async getCongregation(req, res) {
        const { number } = req.params;
        const congExists = await congregationRepository_1.congregationRepository.findOne({
            where: { number },
        });
        if (!congExists) {
            throw new api_errors_1.NotFoundError('Congregation not found');
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
}
exports.default = new CongregationController();
