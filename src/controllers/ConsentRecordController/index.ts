import { Response } from "express-serve-static-core";
import { CustomRequest } from "../../types/customRequest";
import {  BodyCheckConsentRecordTypes, BodyConsentRecordCreateTypes } from "./types";
import { consentRecordRepository } from "../../repositories/consentRecordRepository";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { v4 } from "uuid";


class ConsentRecordController {
    async create(req: CustomRequest<BodyConsentRecordCreateTypes>, res: Response) {
        const { publisher, deviceId } = req.body
        const date = new Date()
        const generateDeviceId = v4()

        const newConsentRecord = consentRecordRepository.create({
            fullName: publisher.fullName,
            nickname: publisher.nickname,
            congregation_id: publisher.congregation_id,
            deviceId: deviceId ?? generateDeviceId,
            consentDate: date
        })

        await consentRecordRepository.save(newConsentRecord).then(suc => {
            res.status(201).json({
                publisher: {
                    fullName: suc.fullName,
                    nickname: suc.nickname,
                    congregation_id: suc.congregation_id,
                    congregation_number: publisher.congregation_number
                },
                deviceId: suc.deviceId,
                consentDate: suc.consentDate
            })
        }).catch(err => {
            console.log(err)
        })
    }

    async checkConsent(req: CustomRequest<BodyCheckConsentRecordTypes>, res: Response) {
        const { fullName, congregation_id, consentDate, deviceId, nickname } = req.body


        const existingConsent = await consentRecordRepository.findOne({
            where: {
                fullName,
                nickname,
                congregation_id,
                consentDate, 
                deviceId
            },
        })

        if (!existingConsent) throw new NotFoundError('Consent record was not found')

        res.send()
    }



}

export default new ConsentRecordController()
