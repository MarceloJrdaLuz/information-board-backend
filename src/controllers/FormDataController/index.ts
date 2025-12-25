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
import { hospitalityGroupRepository } from "../../repositories/hospitalityGroupRepository"
import { cleaningGroupRepository } from "../../repositories/cleaningGroupRepository"
import { familyRepository } from "../../repositories/familyRepository"

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

                case 'fieldService': {
                    const publishers = await publisherRepository.find({
                        where: { congregation: { id: userReq?.congregation.id } },
                        relations: ["privilegesRelation", "privilegesRelation.privilege", "congregation"],
                        order: { fullName: "ASC" },
                    })

                    const fieldConductors = publishers.filter(pp =>
                        pp.privilegesRelation.some(p => p.privilege.name === "Field Conductor")
                    )

                    return res.json({ publishers: fieldConductors })
                }

                case 'territoryHistory': {
                    const publishers = await publisherRepository.find({
                        where: { congregation: { id: userReq?.congregation.id } },
                        relations: ["privilegesRelation", "privilegesRelation.privilege"],
                        order: { fullName: "ASC" },
                    })

                    const fieldConductors = publishers.filter(pp =>
                        pp.privilegesRelation.some(p => p.privilege.name === "Field Conductor")
                    )

                    return res.json(fieldConductors)
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
                        relations: ["talk", "speaker", "speaker.originCongregation", "chairman", "reader", "visitingCongregation"]
                    })

                    const auxiliaryCongregations = await congregationRepository.find({
                        where: {
                            type: CongregationType.AUXILIARY,
                            creatorCongregation: { id: userReq?.congregation.id }
                        }
                    })

                    const mainCongregation = await congregationRepository.findOne({
                        where: { id: userReq?.congregation.id }
                    })

                    const congregations = [
                        ...(mainCongregation ? [mainCongregation] : []),
                        ...auxiliaryCongregations
                    ]


                    return res.json({ speakers, talks, congregations, readers, chairmans, weekendSchedules })
                }

                case "hospitalityGroup": {
                    const publishers = await publisherRepository.find({
                        where: {
                            congregation: {
                                id: userReq?.congregation.id
                            }
                        }
                    })

                    const hospitalityGroups = await hospitalityGroupRepository.find({
                        where: {
                            congregation: {
                                id: userReq?.congregation.id
                            }
                        },
                        relations: ["host", "members"]
                    })

                    return res.json({ publishers, hospitalityGroups })
                }

                case "cleaningGroup": {
                    const publishers = await publisherRepository.find({
                        where: {
                            congregation: {
                                id: userReq?.congregation.id
                            }
                        }
                    })

                    const cleaningGroups = await cleaningGroupRepository.find({
                        where: {
                            congregation: {
                                id: userReq?.congregation.id
                            }
                        },
                        relations: ["publishers"]
                    })

                    return res.json({ publishers, cleaningGroups })
                }
                case "family": {
                    const publishers = await publisherRepository.find({
                        where: {
                            congregation: {
                                id: userReq?.congregation.id
                            }
                        }
                    })

                    const families = await familyRepository.find({
                        where: {
                            congregation: {
                                id: userReq?.congregation.id
                            }
                        },
                        relations: ["responsible", "members"]
                    })

                    return res.json({ publishers, families })
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