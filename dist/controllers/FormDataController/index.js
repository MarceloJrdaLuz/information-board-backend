"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Congregation_1 = require("../../entities/Congregation");
const WeekendSchedule_1 = require("../../entities/WeekendSchedule");
const permissions_1 = require("../../middlewares/permissions");
const cleaningGroupRepository_1 = require("../../repositories/cleaningGroupRepository");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const externalTalkRepository_1 = require("../../repositories/externalTalkRepository");
const familyRepository_1 = require("../../repositories/familyRepository");
const hospitalityGroupRepository_1 = require("../../repositories/hospitalityGroupRepository");
const midweekWorkbookWeekRepository_1 = require("../../repositories/midweekWorkbookWeekRepository");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const speakerRepository_1 = require("../../repositories/speakerRepository");
const specialEventRepository_1 = require("../../repositories/specialEventRepository");
const talkRepository_1 = require("../../repositories/talkRepository");
const userRepository_1 = require("../../repositories/userRepository");
const weekendScheduleRepository_1 = require("../../repositories/weekendScheduleRepository");
const SpecialEventController_1 = require("../SpecialEventController");
const privileges_1 = require("../../types/privileges");
const publisherPrivilegeHelper_1 = require("../../helpers/publisherPrivilegeHelper");
class FormDataController {
    async getFormData(req, res) {
        const requestUser = await (0, permissions_1.decoder)(req);
        const userReq = await userRepository_1.userRepository.findOne({
            where: {
                id: requestUser.id
            },
        });
        try {
            const { form } = req.query;
            switch (form) {
                case 'speaker': {
                    const publishers = await publisherRepository_1.publisherRepository.find({
                        where: { congregation: { id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id } },
                        relations: ["privilegesRelation", "privilegesRelation.privilege", "congregation"],
                        order: { fullName: "ASC" },
                    });
                    const speakers = publishers.filter(pp => (0, publisherPrivilegeHelper_1.hasPrivilege)(pp, privileges_1.PrivilegeCode.SPEAKER));
                    const talks = await talkRepository_1.talkRepository.find({
                        order: { number: "ASC" },
                    });
                    const congregations = await congregationRepository_1.congregationRepository.find({
                        where: {
                            type: Congregation_1.CongregationType.AUXILIARY,
                            creatorCongregation: {
                                id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id
                            }
                        }
                    });
                    return res.json({ publishers: speakers, talks, congregations });
                }
                case 'fieldService': {
                    const publishers = await publisherRepository_1.publisherRepository.find({
                        where: { congregation: { id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id } },
                        relations: ["privilegesRelation", "privilegesRelation.privilege", "congregation"],
                        order: { fullName: "ASC" },
                    });
                    const fieldConductors = publishers.filter(pp => (0, publisherPrivilegeHelper_1.hasPrivilege)(pp, privileges_1.PrivilegeCode.FIELD_CONDUCTOR));
                    return res.json({ publishers: fieldConductors });
                }
                case 'publicWitness': {
                    const publishers = await publisherRepository_1.publisherRepository.find({
                        where: { congregation: { id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id } },
                        relations: ["privilegesRelation", "privilegesRelation.privilege", "congregation"],
                        order: { fullName: "ASC" },
                    });
                    const publicWitnesses = publishers.filter(pp => (0, publisherPrivilegeHelper_1.hasPrivilege)(pp, privileges_1.PrivilegeCode.PUBLIC_WITNESS));
                    return res.json(publicWitnesses);
                }
                case 'territoryHistory': {
                    const publishers = await publisherRepository_1.publisherRepository.find({
                        where: { congregation: { id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id } },
                        relations: ["privilegesRelation", "privilegesRelation.privilege"],
                        order: { fullName: "ASC" },
                    });
                    const fieldConductors = publishers.filter(pp => (0, publisherPrivilegeHelper_1.hasPrivilege)(pp, privileges_1.PrivilegeCode.FIELD_CONDUCTOR));
                    return res.json(fieldConductors);
                }
                case 'externalTalks': {
                    const speakers = await speakerRepository_1.speakerRepository.find({
                        where: {
                            creatorCongregation: {
                                id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id
                            },
                            originCongregation: {
                                id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id
                            }
                        },
                        relations: ["originCongregation", "talks"],
                        order: { fullName: "ASC" },
                    });
                    const talks = await talkRepository_1.talkRepository.find({
                        order: { number: "ASC" },
                    });
                    const congregations = await congregationRepository_1.congregationRepository.find({
                        where: {
                            type: Congregation_1.CongregationType.AUXILIARY,
                            creatorCongregation: {
                                id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id
                            }
                        }
                    });
                    const externalTalks = await externalTalkRepository_1.externalTalkRepository.find({
                        where: {
                            originCongregation: {
                                id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id
                            }
                        },
                        relations: ["speaker", "talk", "destinationCongregation"],
                        order: { date: "ASC" }
                    });
                    return res.json({ speakers, congregations, talks, externalTalks });
                }
                case 'weekendSchedule': {
                    const publishers = await publisherRepository_1.publisherRepository.find({
                        where: { congregation: { id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id } },
                        relations: ["privilegesRelation", "privilegesRelation.privilege", "congregation"],
                        order: { fullName: "ASC" },
                    });
                    const speakers = await speakerRepository_1.speakerRepository.find({
                        where: {
                            creatorCongregation: {
                                id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id
                            }
                        },
                        relations: ["originCongregation", "talks"],
                        order: { fullName: "ASC" },
                    });
                    const chairmans = publishers.filter(pp => (0, publisherPrivilegeHelper_1.hasPrivilege)(pp, privileges_1.PrivilegeCode.CHAIRMAN));
                    const readers = publishers.filter(pp => (0, publisherPrivilegeHelper_1.hasPrivilege)(pp, privileges_1.PrivilegeCode.READER));
                    const talks = await talkRepository_1.talkRepository.find({
                        order: { number: "ASC" },
                    });
                    const weekendSchedules = await weekendScheduleRepository_1.weekendScheduleRepository.find({
                        where: {
                            congregation: {
                                id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id
                            }
                        },
                        relations: ["talk", "speaker", "speaker.originCongregation", "chairman", "reader", "visitingCongregation"]
                    });
                    const auxiliaryCongregations = await congregationRepository_1.congregationRepository.find({
                        where: {
                            type: Congregation_1.CongregationType.AUXILIARY,
                            creatorCongregation: { id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id }
                        }
                    });
                    const mainCongregation = await congregationRepository_1.congregationRepository.findOne({
                        where: { id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id }
                    });
                    // Sincroniza e garante reconhecimento de eventos especiais no fim de semana
                    const specialEvents = await specialEventRepository_1.specialEventRepository.find({
                        where: {
                            congregation: { id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id }
                        }
                    });
                    for (const se of specialEvents) {
                        const dates = (0, SpecialEventController_1.getAffectedWeekendDates)(se.startDate, se.endDate, se.affectsWholeWeek, mainCongregation === null || mainCongregation === void 0 ? void 0 : mainCongregation.dayMeetingPublic);
                        for (const date of dates) {
                            let ws = weekendSchedules.find(s => s.date === date);
                            if (ws) {
                                ws.isSpecial = true;
                                if (!ws.specialName)
                                    ws.specialName = se.title;
                                if (se.cancelWeekendMeeting) {
                                    const hasParts = Boolean(ws.speaker || ws.talk || ws.chairman || ws.reader || ws.visitingCongregation || ws.manualSpeaker || ws.manualTalk || ws.watchTowerStudyTitle);
                                    if (hasParts) {
                                        await weekendScheduleRepository_1.weekendScheduleRepository
                                            .createQueryBuilder()
                                            .update(WeekendSchedule_1.WeekendSchedule)
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
                                            .execute();
                                    }
                                    ws.speaker = null;
                                    ws.speaker_id = null;
                                    ws.talk = null;
                                    ws.talk_id = null;
                                    ws.chairman = null;
                                    ws.chairman_id = null;
                                    ws.reader = null;
                                    ws.reader_id = null;
                                    ws.visitingCongregation = null;
                                    ws.visitingCongregation_id = null;
                                    ws.manualSpeaker = null;
                                    ws.manualTalk = null;
                                    ws.watchTowerStudyTitle = null;
                                }
                            }
                            else {
                                const newWs = weekendScheduleRepository_1.weekendScheduleRepository.create({
                                    congregation: { id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id },
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
                                });
                                await weekendScheduleRepository_1.weekendScheduleRepository.save(newWs);
                                weekendSchedules.push(newWs);
                            }
                        }
                    }
                    const congregations = [
                        ...(mainCongregation ? [mainCongregation] : []),
                        ...auxiliaryCongregations
                    ];
                    const workbookWeeks = await midweekWorkbookWeekRepository_1.midweekWorkbookWeekRepository.find({
                        select: ["weekDate", "watchtowerStudyTheme"]
                    });
                    return res.json({ speakers, talks, congregations, readers, chairmans, weekendSchedules, workbookWeeks });
                }
                case "hospitalityGroup": {
                    const publishers = await publisherRepository_1.publisherRepository.find({
                        where: {
                            congregation: {
                                id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id
                            }
                        }
                    });
                    const hospitalityGroups = await hospitalityGroupRepository_1.hospitalityGroupRepository.find({
                        where: {
                            congregation: {
                                id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id
                            }
                        },
                        relations: ["host", "members"]
                    });
                    return res.json({ publishers, hospitalityGroups });
                }
                case "cleaningGroup": {
                    const allPublishers = await publisherRepository_1.publisherRepository.find({
                        where: {
                            congregation: {
                                id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id
                            }
                        },
                        relations: ["privilegesRelation", "privilegesRelation.privilege"]
                    });
                    const publishers = allPublishers.filter(p => (0, publisherPrivilegeHelper_1.hasPrivilege)(p, privileges_1.PrivilegeCode.PUBLISHER));
                    const cleaningGroups = await cleaningGroupRepository_1.cleaningGroupRepository.find({
                        where: {
                            congregation: {
                                id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id
                            }
                        },
                        relations: ["publishers", "publishers.privilegesRelation", "publishers.privilegesRelation.privilege"]
                    });
                    for (const g of cleaningGroups) {
                        if (g.publishers) {
                            g.publishers = g.publishers.filter(p => (0, publisherPrivilegeHelper_1.hasPrivilege)(p, privileges_1.PrivilegeCode.PUBLISHER));
                        }
                    }
                    return res.json({ publishers, cleaningGroups });
                }
                case "family": {
                    const publishers = await publisherRepository_1.publisherRepository.find({
                        where: {
                            congregation: {
                                id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id
                            }
                        }
                    });
                    const families = await familyRepository_1.familyRepository.find({
                        where: {
                            congregation: {
                                id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id
                            }
                        },
                        relations: ["responsible", "members"]
                    });
                    return res.json({ publishers, families });
                }
                default:
                    return res.status(400).json({ message: "Unknown form" });
            }
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Error fetching form data" });
        }
    }
}
exports.default = new FormDataController();
