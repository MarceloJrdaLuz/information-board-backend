"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const consentRecordRepository_1 = require("../../repositories/consentRecordRepository");
const api_errors_1 = require("../../helpers/api-errors");
const uuid_1 = require("uuid");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const messageErrors_1 = require("../../helpers/messageErrors");
class ConsentRecordController {
    async create(req, res) {
        const { publisher_id, deviceId } = req.body;
        const date = new Date();
        const generateDeviceId = (0, uuid_1.v4)();
        const publisherExists = await publisherRepository_1.publisherRepository.findOne({
            where: { id: publisher_id },
            relations: ["congregation"]
        });
        if (!publisherExists) {
            throw new api_errors_1.BadRequestError(messageErrors_1.messageErrors.notFound.publisher);
        }
        const newConsentRecord = consentRecordRepository_1.consentRecordRepository.create({
            publisher_id: publisherExists.id,
            fullName: publisherExists.fullName,
            nickname: publisherExists.nickname,
            congregation_id: publisherExists.congregation.id,
            deviceId: deviceId !== null && deviceId !== void 0 ? deviceId : generateDeviceId,
            consentDate: date
        });
        const suc = await consentRecordRepository_1.consentRecordRepository.save(newConsentRecord);
        return res.status(201).json({
            publisher: {
                id: suc.publisher_id,
                fullName: suc.fullName,
                nickname: suc.nickname,
                congregation_id: suc.congregation_id,
                congregation_number: publisherExists.congregation.number
            },
            deviceId: suc.deviceId,
            consentDate: suc.consentDate
        });
    }
    async checkConsent(req, res) {
        const { consentDate, deviceId, publisher_id } = req.body;
        const existingConsent = await consentRecordRepository_1.consentRecordRepository.findOne({
            where: {
                publisher_id,
                consentDate,
                deviceId
            },
        });
        if (!existingConsent)
            throw new api_errors_1.NotFoundError('Consent record was not found');
        res.send();
    }
}
exports.default = new ConsentRecordController();
