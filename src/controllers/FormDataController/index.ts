import { Request, Response } from "express"
import { CongregationType } from "../../entities/Congregation"
import { decoder } from "../../middlewares/permissions"
import { congregationRepository } from "../../repositories/congregationRepository"
import { externalTalkRepository } from "../../repositories/externalTalkRepository"
import { publisherRepository } from "../../repositories/publisherRepository"
import { speakerRepository } from "../../repositories/speakerRepository"
import { talkRepository } from "../../repositories/talkRepository"
import { userRepository } from "../../repositories/userRepository"
import { weekendScheduleRepository } from "../../repositories/weekendScheduleRepository"

class FormDataController {
    async getFormData(req: Request, res: Response) {
        const requestUser = await decoder(req)
        const userReq = await userRepository.findOne({
            where: {
                id: requestUser.id
            },
        })
        try {
            const { form } = req.query
            switch (form) {
                case 'speaker': {
                    const publishers = await publisherRepository.find({
                        where: { congregation: { id: userReq?.congregation.id } },
                        relations: ["privilegesRelation", "privilegesRelation.privilege", "congregation"],
                        order: { fullName: "ASC" },
                    })

                    const speakers = publishers.filter(pp =>
                        pp.privilegesRelation.some(p => p.privilege.name === "Speaker")
                    )

                    const talks = await talkRepository.find({
                        order: { number: "ASC" },
                    })

                    const congregations = await congregationRepository.find({
                        where: {
                            type: CongregationType.AUXILIARY,
                            creatorCongregation: {
                                id: userReq?.congregation.id
                            }
                        }
                    })

                    return res.json({ publishers: speakers, talks, congregations })
                }

                case 'externalTalks': {
                    const speakers = await speakerRepository.find({
                        where: {
                            creatorCongregation: {
                                id: userReq?.congregation.id
                            },
                            originCongregation: {
                                id: userReq?.congregation.id
                            }
                        },
                        relations: ["originCongregation", "talks"],
                        order: { fullName: "ASC" },
                    })

                    const talks = await talkRepository.find({
                        order: { number: "ASC" },
                    })

                    const congregations = await congregationRepository.find({
                        where: {
                            type: CongregationType.AUXILIARY,
                            creatorCongregation: {
                                id: userReq?.congregation.id
                            }
                        }
                    })

                    const externalTalks = await externalTalkRepository.find({
                        where: {
                            originCongregation: {
                                id: userReq?.congregation.id
                            }
                        },
                        relations: ["speaker", "talk", "destinationCongregation"],
                        order: { date: "ASC" }
                    })

                    return res.json({ speakers, congregations, talks, externalTalks })
                }

                case 'weekendSchedule': {
                    const publishers = await publisherRepository.find({
                        where: { congregation: { id: userReq?.congregation.id } },
                        relations: ["privilegesRelation", "privilegesRelation.privilege", "congregation"],
                        order: { fullName: "ASC" },
                    })

                    const speakers = await speakerRepository.find({
                        where: {
                            creatorCongregation: {
                                id: userReq?.congregation.id
                            }
                        },
                        relations: ["originCongregation", "talks"],
                        order: { fullName: "ASC" },
                    })

                    const chairmans = publishers.filter(pp =>
                        pp.privilegesRelation.some(p => p.privilege.name === "Chairman")
                    )

                    const readers = publishers.filter(pp =>
                        pp.privilegesRelation.some(p => p.privilege.name === "Reader")
                    )

                    const talks = await talkRepository.find({
                        order: { number: "ASC" },
                    })

                    const weekendSchedules = await weekendScheduleRepository.find({
                        where: {
                            congregation: {
                                id: userReq?.congregation.id
                            }
                        },
                        relations: ["talk", "speaker", "speaker.originCongregation", "chairman", "reader"]
                    })

                    const congregations = await congregationRepository.find({
                        where: {
                            type: CongregationType.AUXILIARY,
                            creatorCongregation: {
                                id: userReq?.congregation.id
                            }
                        }
                    })

                    return res.json({ speakers, talks, congregations, readers, chairmans, weekendSchedules })
                }

                default:
                    return res.status(400).json({ message: "Unknown form" })
            }

        } catch (err) {
            console.error(err)
            return res.status(500).json({ message: "Error fetching form data" })
        }
    }
}

export default new FormDataController()