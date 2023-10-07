"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const consentRecordRepository_1 = require("../../repositories/consentRecordRepository");
const api_errors_1 = require("../../helpers/api-errors");
const uuid_1 = require("uuid");
class ConsentRecordController {
    async create(req, res) {
        const { publisher, deviceId } = req.body;
        const date = new Date();
        const generateDeviceId = (0, uuid_1.v4)();
        const newConsentRecord = consentRecordRepository_1.consentRecordRepository.create({
            fullName: publisher.fullName,
            nickname: publisher.nickname,
            congregation_id: publisher.congregation_id,
            deviceId: deviceId !== null && deviceId !== void 0 ? deviceId : generateDeviceId,
            consentDate: date
        });
        await consentRecordRepository_1.consentRecordRepository.save(newConsentRecord).then(suc => {
            res.status(201).json({
                publisher: {
                    fullName: suc.fullName,
                    nickname: suc.nickname,
                    congregation_id: suc.congregation_id
                },
                deviceId: suc.deviceId,
                consentDate: suc.consentDate
            });
        }).catch(err => {
            console.log(err);
        });
    }
    async checkConsent(req, res) {
        const { fullName, congregation_id, consentDate, deviceId, nickname } = req.body;
        const existingConsent = await consentRecordRepository_1.consentRecordRepository.findOne({
            where: {
                fullName,
                nickname,
                congregation_id,
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
