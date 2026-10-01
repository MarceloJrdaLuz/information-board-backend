import { Request, Response } from "express"
import { CongregationType } from "../../entities/Congregation"
import { WeekendSchedule } from "../../entities/WeekendSchedule"
import { decoder } from "../../middlewares/permissions"
import { cleaningGroupRepository } from "../../repositories/cleaningGroupRepository"
import { congregationRepository } from "../../repositories/congregationRepository"
import { externalTalkRepository } from "../../repositories/externalTalkRepository"
import { familyRepository } from "../../repositories/familyRepository"
import { hospitalityGroupRepository } from "../../repositories/hospitalityGroupRepository"
import { midweekWorkbookWeekRepository } from "../../repositories/midweekWorkbookWeekRepository"
import { publisherRepository } from "../../repositories/publisherRepository"
import { speakerRepository } from "../../repositories/speakerRepository"
import { specialEventRepository } from "../../repositories/specialEventRepository"
import { talkRepository } from "../../repositories/talkRepository"
import { userRepository } from "../../repositories/userRepository"
import { weekendScheduleRepository } from "../../repositories/weekendScheduleRepository"
import { getAffectedWeekendDates } from "../SpecialEventController"

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
                case 'publicWitness': {
                    const publishers = await publisherRepository.find({
                        where: { congregation: { id: userReq?.congregation.id } },
                        relations: ["privilegesRelation", "privilegesRelation.privilege", "congregation"],
                        order: { fullName: "ASC" },
                    })

                    const publicWitnesses = publishers.filter(pp =>
                        pp.privilegesRelation.some(p => p.privilege.name === "Public Witness")
                    )

                    return res.json(publicWitnesses)
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

                    // Sincroniza e garante reconhecimento de eventos especiais no fim de semana
                    const specialEvents = await specialEventRepository.find({
                        where: {
                            congregation: { id: userReq?.congregation.id }
                        }
                    })

                    for (const se of specialEvents) {
                        const dates = getAffectedWeekendDates(
                            se.startDate,
                            se.endDate,
                            se.affectsWholeWeek,
                            mainCongregation?.dayMeetingPublic
                        )

                        for (const date of dates) {
                            let ws = weekendSchedules.find(s => s.date === date)
                            if (ws) {
                                ws.isSpecial = true
                                if (!ws.specialName) ws.specialName = se.title
                                if (se.cancelWeekendMeeting) {
                                    const hasParts = Boolean(ws.speaker || ws.talk || ws.chairman || ws.reader || ws.visitingCongregation || ws.manualSpeaker || ws.manualTalk || ws.watchTowerStudyTitle)
                                    if (hasParts) {
                                        await weekendScheduleRepository
                                            .createQueryBuilder()
                                            .update(WeekendSchedule)
                                            .set({
                                                speaker: null,
                                                speaker_id: null,
                                                talk: null,
                                                talk_id: null,
                                                chairman: null,
                                                chairman_id: null,
                                                reader: null,
                                                reader_id: null,
                                                visitingCongregation: null,
                                                visitingCongregation_id: null,
                                                manualSpeaker: null,
                                                manualTalk: null,
                                                watchTowerStudyTitle: null,
                                                isSpecial: true,
                                                specialName: se.title
                                            })
                                            .where("id = :id", { id: ws.id })
                                            .execute()
                                    }
                                    ws.speaker = null
                                    ws.speaker_id = null
                                    ws.talk = null
                                    ws.talk_id = null
                                    ws.chairman = null
                                    ws.chairman_id = null
                                    ws.reader = null
                                    ws.reader_id = null
                                    ws.visitingCongregation = null
                                    ws.visitingCongregation_id = null
                                    ws.manualSpeaker = null
                                    ws.manualTalk = null
                                    ws.watchTowerStudyTitle = null
                                }
                            } else {
                                const newWs = weekendScheduleRepository.create({
                                    congregation: { id: userReq?.congregation.id },
                                    date,
                                    isSpecial: true,
                                    specialName: se.title,
                                    watchTowerStudyTitle: null,
                                    chairman: null,
                                    chairman_id: null,
                                    reader: null,
                                    reader_id: null,
                                    speaker: null,
                                    speaker_id: null,
                                    talk: null,
                                    talk_id: null,
                                    visitingCongregation: null,
                                    visitingCongregation_id: null,
                                    manualSpeaker: null,
                                    manualTalk: null
                                })
                                await weekendScheduleRepository.save(newWs)
                                weekendSchedules.push(newWs as any)
                            }
                        }
                    }

                    const congregations = [
                        ...(mainCongregation ? [mainCongregation] : []),
                        ...auxiliaryCongregations
                    ]

                    const workbookWeeks = await midweekWorkbookWeekRepository.find({
                        select: ["weekDate", "watchtowerStudyTheme"]
                    })

                    return res.json({ speakers, talks, congregations, readers, chairmans, weekendSchedules, workbookWeeks })

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