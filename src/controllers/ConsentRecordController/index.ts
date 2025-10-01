import { Response } from "express-serve-static-core";
import { CustomRequest } from "../../types/customRequest";
import { BodyCheckConsentRecordTypes, BodyConsentRecordCreateTypes } from "./types";
import { consentRecordRepository } from "../../repositories/consentRecordRepository";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { v4 } from "uuid";
import { publisherRepository } from "../../repositories/publisherRepository";
import { messageErrors } from "../../helpers/messageErrors";


class ConsentRecordController {
    async create(req: CustomRequest<BodyConsentRecordCreateTypes>, res: Response) {
        const { publisher_id, deviceId } = req.body
        const date = new Date()
        const generateDeviceId = v4()

        const publisherExists = await publisherRepository.findOne({
            where: { id: publisher_id },
            relations: ["congregation"]
        })

        if (!publisherExists) {
            throw new BadRequestError(messageErrors.notFound.publisher)
        }

        const newConsentRecord = consentRecordRepository.create({
            publisher_id: publisherExists.id,
            fullName: publisherExists.fullName,
            nickname: publisherExists.nickname,
            congregation_id: publisherExists.congregation.id,
            deviceId: deviceId ?? generateDeviceId,
            consentDate: date
        })

        const suc = await consentRecordRepository.save(newConsentRecord)

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
        })
    }

    async checkConsent(req: CustomRequest<BodyCheckConsentRecordTypes>, res: Response) {
        const { consentDate, deviceId, publisher_id } = req.body

        const existingConsent = await consentRecordRepository.findOne({
            where: {
                publisher_id,
                consentDate,
                deviceId
            },
        })

        if (!existingConsent) throw new NotFoundError('Consent record was not found')

        res.send()
    }
}

export default new ConsentRecordController()
