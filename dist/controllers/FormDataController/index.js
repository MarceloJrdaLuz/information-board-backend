"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Congregation_1 = require("../../entities/Congregation");
const permissions_1 = require("../../middlewares/permissions");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const externalTalkRepository_1 = require("../../repositories/externalTalkRepository");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const speakerRepository_1 = require("../../repositories/speakerRepository");
const talkRepository_1 = require("../../repositories/talkRepository");
const userRepository_1 = require("../../repositories/userRepository");
const weekendScheduleRepository_1 = require("../../repositories/weekendScheduleRepository");
const hospitalityGroupRepository_1 = require("../../repositories/hospitalityGroupRepository");
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
                    const speakers = publishers.filter(pp => pp.privilegesRelation.some(p => p.privilege.name === "Speaker"));
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
                case 'territoryHistory': {
                    const publishers = await publisherRepository_1.publisherRepository.find({
                        where: { congregation: { id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id } },
                        relations: ["privilegesRelation", "privilegesRelation.privilege"],
                        order: { fullName: "ASC" },
                    });
                    const fieldConductors = publishers.filter(pp => pp.privilegesRelation.some(p => p.privilege.name === "Field Conductor"));
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
                    const chairmans = publishers.filter(pp => pp.privilegesRelation.some(p => p.privilege.name === "Chairman"));
                    const readers = publishers.filter(pp => pp.privilegesRelation.some(p => p.privilege.name === "Reader"));
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
                    const congregations = [
                        ...(mainCongregation ? [mainCongregation] : []),
                        ...auxiliaryCongregations
                    ];
                    return res.json({ speakers, talks, congregations, readers, chairmans, weekendSchedules });
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
