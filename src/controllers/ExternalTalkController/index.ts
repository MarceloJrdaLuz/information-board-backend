import { Response } from "express"
import { Talk } from "../../entities/Talk"
import { BadRequestError } from "../../helpers/api-errors"
import { messageErrors } from "../../helpers/messageErrors"
import { congregationRepository } from "../../repositories/congregationRepository"
import { externalTalkRepository } from "../../repositories/externalTalkRepository"
import { speakerRepository } from "../../repositories/speakerRepository"
import { talkRepository } from "../../repositories/talkRepository"
import { CustomRequestPT, ParamsCustomRequest, TypedRequest } from "../../types/customRequest"
import { BodyCreateExternalTalk, BodyUpdateExternalTalk, BodyUpdateStatusExternalTalk, ParamsCreateExternalTalks, ParamsExternalTalk, ParamsGetExternalTalks, QueryExternalTalkByPeriod } from "./types"
import { Between } from "typeorm"
import moment from "moment-timezone"

class ExternalTalkController {
    async create(req: CustomRequestPT<ParamsCreateExternalTalks, BodyCreateExternalTalk>, res: Response) {
        const { congregation_id } = req.params
        const { destinationCongregation_id, speaker_id, talk_id, manualTalk, date } = req.body

        const originCongregation = await congregationRepository.findOne({
            where: {
                id: congregation_id
            }
        })

        if (!date) {
            throw new BadRequestError("Date is required")
        }

        if (!originCongregation) {
            throw new BadRequestError("Origin Congregation not found")
        }

        if (!talk_id && !manualTalk) {
            throw new BadRequestError("Either talkId or manualTalk must be provided")
        }

        const speaker = await speakerRepository.findOne({
            where: {
                id: speaker_id,
                creatorCongregation: {
                    id: congregation_id
                },
                originCongregation: {
                    id: congregation_id
                }
            },
        })
        if (!speaker) {
            throw new BadRequestError(messageErrors.notFound.speaker)
        }

        const destinationCongregation = await congregationRepository.findOne({
            where: {
                id: destinationCongregation_id,
                creatorCongregation: {
                    id: congregation_id
                }
            }
        })

        if (!destinationCongregation) {
            throw new BadRequestError("Destination Congregation not found")
        }

        let talk: Talk | null = null
        if (talk_id) {
            talk = await talkRepository.findOneBy({ id: talk_id })
            if (!talk) {
                throw new BadRequestError(messageErrors.notFound.talk)
            }
        }

        const externalTalk = externalTalkRepository.create({
            speaker,
            talk,
            manualTalk: talk_id ? null : manualTalk,
            destinationCongregation,
            originCongregation,
            date: moment(date).format("YYYY-MM-DD"),
            status: "pending",
        })

        await externalTalkRepository.save(externalTalk)

        return res.status(201).json(externalTalk)
    }

    async getExternalTalks(req: ParamsCustomRequest<ParamsGetExternalTalks>, res: Response) {
        const { congregation_id } = req.params
        const externalTalks = await externalTalkRepository.find({
            where: {
                originCongregation: {
                    id: congregation_id
                }
            },
            relations: ["speaker", "talk", "destinationCongregation"],
            order: { date: "ASC" }
        })

        return res.json(externalTalks)
    }

    async getExternalTalksByPeriod(
        req: TypedRequest<ParamsGetExternalTalks, {}, {}, QueryExternalTalkByPeriod>,
        res: Response
    ) {
        const { congregation_id } = req.params
        const { start, end } = req.query

        const startFormatted = moment(start, "YYYY-MM-DD").format("YYYY-MM-DD");
        const endFormatted = moment(end, "YYYY-MM-DD").format("YYYY-MM-DD");

        const externalTalks = await externalTalkRepository.find({
            where: {
                originCongregation: { id: congregation_id },
                date: Between(startFormatted, endFormatted)
            },
            relations: ["speaker", "talk", "destinationCongregation"],
            order: { date: "ASC" }
        })

        return res.json(externalTalks)
    }


    async update(req: CustomRequestPT<ParamsExternalTalk, BodyUpdateExternalTalk>, res: Response) {
        const { externalTalk_id: id } = req.params
        const { speaker_id, destinationCongregation_id, talk_id, manualTalk, status, date } = req.body

        const externalTalk = await externalTalkRepository.findOne({
            where: { id }
        })

        if (!externalTalk) {
            throw new BadRequestError(messageErrors.notFound.externalTalk)
        }

        if (speaker_id) {
            const speaker = await speakerRepository.findOneBy({ id: speaker_id })
            if (!speaker) throw new BadRequestError(messageErrors.notFound.speaker)
            externalTalk.speaker = speaker
        }

        if (destinationCongregation_id) {
            const congregation = await congregationRepository.findOneBy({ id: destinationCongregation_id })
            if (!congregation) throw new BadRequestError(messageErrors.notFound.congregation)
            externalTalk.destinationCongregation = congregation
        }

        if (talk_id) {
            const talk = await talkRepository.findOneBy({ id: talk_id })
            if (!talk) throw new BadRequestError(messageErrors.notFound.talk)
            externalTalk.talk = talk
            externalTalk.manualTalk = null // zera manual
        } else if (manualTalk) {
            externalTalk.manualTalk = manualTalk
            externalTalk.talk = null
        }

        if (status) {
            externalTalk.status = status
        }

        externalTalk.date = moment(date).format("YYYY-MM-DD")
            ?? externalTalk.date

        await externalTalkRepository.save(externalTalk)

        return res.json(externalTalk)
    }

    async updateStatus(req: CustomRequestPT<ParamsExternalTalk, BodyUpdateStatusExternalTalk>, res: Response) {
        const { externalTalk_id: id } = req.params
        const { status } = req.body
        
        const externalTalk = await externalTalkRepository.findOneBy({ id })
        if (!externalTalk) {
            throw new BadRequestError("External talk not found")
        }

        externalTalk.status = status ?? externalTalk.status
        await externalTalkRepository.save(externalTalk)

        return res.json(externalTalk)
    }


    async delete(req: ParamsCustomRequest<ParamsExternalTalk>, res: Response) {

        const { externalTalk_id: id } = req.params
        const externalTalk = await externalTalkRepository.findOneBy({ id })

        if (!externalTalk) {
            throw new BadRequestError(messageErrors.notFound.externalTalk)
        }

        await externalTalkRepository.remove(externalTalk)

        return res.status(204).send()
    }
}

export default new ExternalTalkController()