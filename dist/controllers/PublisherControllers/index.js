"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const typeorm_1 = require("typeorm");
const Congregation_1 = require("../../entities/Congregation");
const GroupOverseers_1 = require("../../entities/GroupOverseers");
const HospitalityGroup_1 = require("../../entities/HospitalityGroup.");
const Publisher_1 = require("../../entities/Publisher");
const Speaker_1 = require("../../entities/Speaker");
const User_1 = require("../../entities/User");
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
const privilegesTranslations_1 = require("../../helpers/privilegesTranslations");
const cleaningScheduleRepository_1 = require("../../repositories/cleaningScheduleRepository");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const emergencyContact_1 = require("../../repositories/emergencyContact");
const externalTalkRepository_1 = require("../../repositories/externalTalkRepository");
const fieldServiceScheduleRepository_1 = require("../../repositories/fieldServiceScheduleRepository");
const hospitalityAssignmentRepository_1 = require("../../repositories/hospitalityAssignmentRepository");
const privilegeRepository_1 = require("../../repositories/privilegeRepository");
const publisherPrivilegeRepository_1 = require("../../repositories/publisherPrivilegeRepository");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const userRepository_1 = require("../../repositories/userRepository");
const weekendScheduleRepository_1 = require("../../repositories/weekendScheduleRepository");
const privileges_1 = require("../../types/privileges");
const publicWitnessAssignmentRepository_1 = require("../../repositories/publicWitnessAssignmentRepository");
class PublisherControler {
    async create(req, res) {
        const { fullName, nickname, privileges, congregation_id, gender, hope, dateImmersed, birthDate, pioneerMonths, startPioneer, situation, phone, address, emergencyContact_id } = req.body;
        if (privileges) {
            if (privileges.includes(privileges_1.Privileges.PIONEIROAUXILIAR) && !pioneerMonths) {
                throw new api_errors_1.BadRequestError('You must provide the "pioneerMonths" field when assigning the "Pioneiro Auxiliar" privilege');
            }
            if (privileges.includes(privileges_1.Privileges.PIONEIROREGULAR) && !startPioneer) {
                throw new api_errors_1.BadRequestError('You must provide the "startPioneer" field when assigning the "Pioneiro Regular" ou "Pioneiro auxiliar indeterminado" privilege');
            }
        }
        const privilegesExists = privileges === null || privileges === void 0 ? void 0 : privileges.every(privilege => Object.values(privileges_1.Privileges).includes(privilege));
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation)
            throw new api_errors_1.BadRequestError('Congregation not exists');
        // Verificar se o fullName já existe na congregação
        const existingPublisherSomeFullName = await publisherRepository_1.publisherRepository.find({
            where: {
                fullName,
                congregation: {
                    id: congregation.id
                }
            }
        });
        if (existingPublisherSomeFullName.length > 0) {
            if (!nickname) {
                throw new api_errors_1.BadRequestError('A nickname is required to differentiate the publisher');
            }
            const nicknameAlreadyExists = existingPublisherSomeFullName.some(publisher => publisher.nickname === nickname);
            if (nicknameAlreadyExists)
                throw new api_errors_1.BadRequestError('Nickname already exists too');
        }
        if (!privilegesExists)
            throw new api_errors_1.BadRequestError('Some privilege not exists');
        const newPublisher = publisherRepository_1.publisherRepository.create({
            fullName,
            nickname,
            gender,
            hope,
            dateImmersed,
            birthDate,
            privileges,
            pioneerMonths,
            congregation,
            startPioneer,
            situation,
            phone,
            address
        });
        if (emergencyContact_id) {
            const contact = await emergencyContact_1.emergencyContactRepository.findOneBy({ id: emergencyContact_id });
            newPublisher.emergencyContact = contact !== null && contact !== void 0 ? contact : null; // permite que seja null
        }
        await publisherRepository_1.publisherRepository.save(newPublisher).catch(err => {
            throw new api_errors_1.BadRequestError(err);
        });
        if (privileges === null || privileges === void 0 ? void 0 : privileges.length) {
            for (const privilegePT of privileges) {
                const privilegeEN = privilegesTranslations_1.privilegePTtoEN[privilegePT];
                if (!privilegeEN)
                    continue; // ou lançar erro se quiser validar
                const privilegeEntity = await privilegeRepository_1.privilegeRepository.findOneBy({ name: privilegeEN });
                if (privilegeEntity) {
                    await publisherPrivilegeRepository_1.publisherPrivilegeRepository.save({
                        publisher: newPublisher,
                        privilege: privilegeEntity,
                        startDate: startPioneer !== null && startPioneer !== void 0 ? startPioneer : null,
                        endDate: null
                    });
                }
            }
        }
        return res.status(201).json(newPublisher);
    }
    async update(req, res) {
        const { publisher_id: id } = req.params;
        const { fullName, nickname, privileges, gender, hope, dateImmersed, birthDate, pioneerMonths, situation, phone, address, startPioneer, emergencyContact_id } = req.body;
        const publisher = await publisherRepository_1.publisherRepository.findOne({
            where: { id },
            relations: ["congregation"]
        });
        if (!publisher) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.publisher);
        }
        if (privileges) {
            if (privileges.includes(privileges_1.Privileges.PIONEIROAUXILIAR) && !pioneerMonths) {
                throw new api_errors_1.BadRequestError('You must provide the "pioneerMonths" field when assigning the "PIONEIRO AUXILIAR" privilege');
            }
            if (privileges.includes(privileges_1.Privileges.PIONEIROREGULAR) && !startPioneer) {
                throw new api_errors_1.BadRequestError('You must provide the "startRegularPioneer" field when assigning the "Pioneiro Regular" privilege');
            }
            const privilegesExists = privileges === null || privileges === void 0 ? void 0 : privileges.every(privilege => Object.values(privileges_1.Privileges).includes(privilege));
            if (!privilegesExists) {
                throw new api_errors_1.BadRequestError('Some privilege not exists');
            }
        }
        if (emergencyContact_id) {
            const contact = await emergencyContact_1.emergencyContactRepository.findOneBy({ id: emergencyContact_id });
            publisher.emergencyContact = contact !== null && contact !== void 0 ? contact : null; // permite que seja null
        }
        if (fullName && fullName !== publisher.fullName) {
            const existingPublisherSomeFullName = await publisherRepository_1.publisherRepository.find({
                where: {
                    fullName,
                    congregation: {
                        id: publisher.congregation.id
                    }
                }
            });
            if (existingPublisherSomeFullName.length > 0 && !nickname) {
                throw new api_errors_1.BadRequestError('This fullname already exists in the congregation, a nickname is required to differentiate the publisher');
            }
            const nicknameAlreadyExists = existingPublisherSomeFullName.some(publisher => publisher.nickname === nickname);
            if (nicknameAlreadyExists)
                throw new api_errors_1.BadRequestError('Nickname already exists too');
        }
        const privilegesEN = (0, privilegesTranslations_1.translatePrivilegesPTToEN)(privileges !== null && privileges !== void 0 ? privileges : []);
        // Atualizar as propriedades do publisher
        publisher.fullName = fullName !== undefined ? fullName : publisher.fullName;
        publisher.nickname = nickname !== undefined ? nickname : publisher.nickname;
        publisher.gender = gender !== undefined ? gender : publisher.gender;
        publisher.hope = hope !== undefined ? hope : publisher.hope;
        publisher.privileges = privileges !== undefined ? privileges : publisher.privileges;
        publisher.pioneerMonths = pioneerMonths !== undefined ? pioneerMonths : publisher.pioneerMonths;
        publisher.birthDate = birthDate !== undefined ? birthDate : publisher.birthDate;
        publisher.dateImmersed = dateImmersed !== undefined ? dateImmersed : publisher.dateImmersed;
        publisher.situation = situation !== undefined ? situation : publisher.situation;
        publisher.startPioneer = startPioneer !== undefined ? startPioneer : publisher.startPioneer;
        publisher.phone = phone !== undefined ? phone : publisher.phone;
        publisher.address = address !== undefined ? address : publisher.address;
        publisher.privileges = privileges && (privileges === null || privileges === void 0 ? void 0 : privileges.length) > 0 ? privileges : publisher.privileges;
        await publisherRepository_1.publisherRepository.save(publisher);
        if (privileges && privileges.length > 0) {
            const privilegesEN = (0, privilegesTranslations_1.translatePrivilegesPTToEN)(privileges);
            // Busca entidades reais dos privilégios em inglês
            const privilegeEntities = await privilegeRepository_1.privilegeRepository.findBy({
                name: (0, typeorm_1.In)(privilegesEN)
            });
            // Extrai os IDs
            const privilegeIds = privilegeEntities.map(p => p.id);
            // Remove privilégios antigos que não estão mais na lista
            await publisherPrivilegeRepository_1.publisherPrivilegeRepository.delete({
                publisher: { id: publisher.id },
                privilege: { id: (0, typeorm_1.Not)((0, typeorm_1.In)(privilegeIds)) }
            });
            for (const privilegeName of privilegesEN) {
                const privilegeEntity = await privilegeRepository_1.privilegeRepository.findOneBy({ name: privilegeName });
                if (!privilegeEntity)
                    continue;
                const exists = await publisherPrivilegeRepository_1.publisherPrivilegeRepository.findOne({
                    where: { publisher: { id: publisher.id }, privilege: { id: privilegeEntity.id } }
                });
                if (!exists) {
                    await publisherPrivilegeRepository_1.publisherPrivilegeRepository.save({
                        publisher,
                        privilege: privilegeEntity,
                        startDate: startPioneer !== null && startPioneer !== void 0 ? startPioneer : null,
                        endDate: null
                    });
                }
            }
        }
        return res.status(201).json(publisher);
    }
    async delete(req, res) {
        const { publisher_id: id } = req.params;
        const publisher = await publisherRepository_1.publisherRepository.findOne({
            where: {
                id
            }
        });
        if (!publisher)
            throw new api_errors_1.BadRequestError('Publisher not exists');
        await publisherRepository_1.publisherRepository.remove(publisher);
        return res.status(200).end();
    }
    async getPublishers(req, res) {
        const { congregation_id } = req.params;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        const publishers = await publisherRepository_1.publisherRepository.find({
            where: {
                congregation: {
                    id: congregation_id
                }
            }, relations: ['group', 'congregation', "emergencyContact", "hospitalityGroup"]
        }).catch(err => console.log(err));
        return res.status(200).json(publishers);
    }
    async getPublishersWithCongregatioNumber(req, res) {
        const { congregationNumber } = req.params;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ number: congregationNumber });
        if (!congregation)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        const publishers = await publisherRepository_1.publisherRepository.find({
            where: {
                congregation: {
                    id: congregation.id
                }
            },
            select: ['fullName', 'nickname', "congregation", "id"],
        });
        const publishersNames = publishers.map(publisher => ({
            id: publisher.id,
            fullName: publisher.fullName,
            nickname: publisher.nickname,
            congregation_id: congregation.id,
            congregation_number: congregation.number
        }));
        return res.status(200).json(publishersNames);
    }
    async getPublisher(req, res) {
        const { publisher_id } = req.params;
        const publisher = await publisherRepository_1.publisherRepository.findOne({
            where: {
                id: publisher_id
            },
            relations: ["user", "emergencyContact"],
        });
        if (!publisher)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.publisher);
        return res.status(200).json(publisher);
    }
    async getAssignmentPublisher(req, res) {
        const { publisher_id } = req.params;
        const publisher = await publisherRepository_1.publisherRepository.findOne({
            where: {
                id: publisher_id
            },
            relations: ["congregation"]
        });
        if (!publisher) {
            throw new api_errors_1.BadRequestError(messageErrors_1.messageErrors.notFound.publisher);
        }
        const assignmentsMeeting = await weekendScheduleRepository_1.weekendScheduleRepository.find({
            where: [
                { chairman: { id: publisher_id }, date: (0, typeorm_1.MoreThanOrEqual)((0, dayjs_1.default)().format("YYYY-MM-DD")) },
                { reader: { id: publisher_id }, date: (0, typeorm_1.MoreThanOrEqual)((0, dayjs_1.default)().format("YYYY-MM-DD")) },
                { speaker: { publisher: { id: publisher_id } }, date: (0, typeorm_1.MoreThanOrEqual)((0, dayjs_1.default)().format("YYYY-MM-DD")) },
            ],
            relations: ["chairman", "reader", "speaker", "speaker.publisher", "talk", "congregation"],
            order: { date: "ASC" }
        });
        const cleaningSchedules = await cleaningScheduleRepository_1.cleaningScheduleRepository.find({
            where: {
                date: (0, typeorm_1.MoreThanOrEqual)((0, dayjs_1.default)().format("YYYY-MM-DD")),
                group: {
                    publishers: {
                        id: publisher_id
                    }
                }
            },
            relations: [
                "group",
                "group.publishers"
            ],
            order: {
                date: "ASC"
            }
        });
        const publicWitnessAssignments = await publicWitnessAssignmentRepository_1.publicWitnessAssignmentRepository
            .createQueryBuilder("pw")
            .innerJoin("pw.publishers", "pp")
            .innerJoin("pp.publisher", "publisherFilter")
            .leftJoinAndSelect("pw.publishers", "allPublishers")
            .leftJoinAndSelect("allPublishers.publisher", "publisher")
            .leftJoinAndSelect("pw.timeSlot", "timeSlot")
            .leftJoinAndSelect("timeSlot.arrangement", "arrangement")
            .where("publisherFilter.id = :publisher_id", { publisher_id })
            .andWhere("pw.date >= :today", {
            today: (0, dayjs_1.default)().format("YYYY-MM-DD")
        })
            .orderBy("pw.date", "ASC")
            .getMany();
        const hospitality = await hospitalityAssignmentRepository_1.hospitalityAssignmentRepository.find({
            where: {
                weekend: {
                    date: (0, typeorm_1.MoreThanOrEqual)((0, dayjs_1.default)().format("YYYY-MM-DD"))
                }
            },
            relations: ['group', 'group.members', 'group.host', 'weekend']
        });
        const externalTalks = await externalTalkRepository_1.externalTalkRepository.find({
            where: {
                speaker: {
                    publisher: {
                        id: publisher_id
                    }
                },
                date: (0, typeorm_1.MoreThanOrEqual)((0, dayjs_1.default)().format("YYYY-MM-DD"))
            },
            relations: ['destinationCongregation', 'talk']
        });
        const fieldServiceRotationAssignments = await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.find({
            where: {
                leader: { id: publisher_id },
                date: (0, typeorm_1.MoreThanOrEqual)((0, dayjs_1.default)().format("YYYY-MM-DD")),
            },
            order: {
                date: "ASC",
            },
            relations: ["template", "leader"],
        });
        const filteredHospitality = hospitality.filter(h => {
            var _a, _b, _c, _d;
            // Verifica se o publisher é host OU membro do grupo
            return ((_b = (_a = h.group) === null || _a === void 0 ? void 0 : _a.host) === null || _b === void 0 ? void 0 : _b.id) === publisher_id ||
                ((_d = (_c = h.group) === null || _c === void 0 ? void 0 : _c.members) === null || _d === void 0 ? void 0 : _d.some(member => member.id === publisher_id));
        });
        const publicWitnessMapped = publicWitnessAssignments.map(pw => ({
            role: "Testemunho Público",
            date: pw.date,
            title: pw.timeSlot.arrangement.title,
            start_time: pw.timeSlot.start_time,
            end_time: pw.timeSlot.end_time,
            publishers: pw.publishers.map(p => {
                var _a, _b;
                return ({
                    id: p.publisher.id,
                    name: (_b = (_a = p.publisher.nickname) !== null && _a !== void 0 ? _a : p.publisher.fullName) !== null && _b !== void 0 ? _b : "-"
                });
            })
        }));
        // 4️⃣ Mapeia as designações de hospitalidade
        const hospitalityAssignments = filteredHospitality.map((h) => {
            var _a, _b, _c, _d;
            return ({
                role: ((_b = (_a = h.group) === null || _a === void 0 ? void 0 : _a.host) === null || _b === void 0 ? void 0 : _b.id) === publisher_id ? "Anfitrião" : "Hospitalidade",
                eventType: h.eventType,
                date: h.weekend.date,
                group: {
                    id: (_c = h.group) === null || _c === void 0 ? void 0 : _c.id,
                    name: (_d = h.group) === null || _d === void 0 ? void 0 : _d.name,
                },
            });
        });
        const assignments = assignmentsMeeting.map((s) => {
            var _a, _b, _c, _d;
            if (((_a = s.chairman) === null || _a === void 0 ? void 0 : _a.id) === publisher_id && s.congregation.id === publisher.congregation.id) {
                return {
                    role: "Presidente",
                    date: s.date,
                };
            }
            if (((_b = s.reader) === null || _b === void 0 ? void 0 : _b.id) === publisher_id && s.congregation.id === publisher.congregation.id) {
                return {
                    role: "Leitor",
                    date: s.date,
                };
            }
            if (((_d = (_c = s.speaker) === null || _c === void 0 ? void 0 : _c.publisher) === null || _d === void 0 ? void 0 : _d.id) === publisher_id) {
                return {
                    role: "Orador",
                    date: s.date,
                    destinationCongregation: s.congregation,
                    talk: s.talk ? { number: s.talk.number, title: s.talk.title } : null,
                };
            }
            return undefined;
        }).filter(Boolean);
        // 🔹 Mapeia designações de limpeza
        const cleaningAssignments = cleaningSchedules.map((c) => ({
            role: "Limpeza do Salão",
            date: c.date
        }));
        const fieldServiceRotationMapped = fieldServiceRotationAssignments.map(fs => ({
            role: "Dirigente de Campo",
            date: fs.date,
            fieldServiceHour: fs.template.time,
            fieldServiceLocation: fs.template.location,
        }));
        // 🔹 Mapeia designações externas
        const externalAssignments = externalTalks.map(e => {
            var _a, _b, _c, _d, _e, _f;
            return ({
                role: "Discurso Externo",
                date: e.date,
                status: e.status,
                talk: e.talk ? e.talk : e.manualTalk,
                destinationCongregation: {
                    name: (_a = e.destinationCongregation) === null || _a === void 0 ? void 0 : _a.name,
                    city: (_b = e.destinationCongregation) === null || _b === void 0 ? void 0 : _b.city,
                    address: e.destinationCongregation.address,
                    latitude: (_c = e.destinationCongregation) === null || _c === void 0 ? void 0 : _c.latitude,
                    longitude: (_d = e.destinationCongregation) === null || _d === void 0 ? void 0 : _d.longitude,
                    dayMeetingPublic: (_e = e.destinationCongregation) === null || _e === void 0 ? void 0 : _e.dayMeetingPublic,
                    hourMeetingPublic: (_f = e.destinationCongregation) === null || _f === void 0 ? void 0 : _f.hourMeetingPublic,
                }
            });
        });
        const allAssignments = [
            ...assignments,
            ...hospitalityAssignments,
            ...externalAssignments,
            ...cleaningAssignments,
            ...fieldServiceRotationMapped,
            ...publicWitnessMapped
        ];
        // 🔹 Ordena por data
        allAssignments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return res.status(200).json(allAssignments);
    }
    async unlinkPublisherFromUser(req, res) {
        const { publisher_id } = req.params;
        const publisher = await publisherRepository_1.publisherRepository.findOne({
            where: {
                id: publisher_id
            },
            relations: ["user"]
        });
        if (!publisher) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.publisher);
        }
        if (!publisher.user) {
            throw new api_errors_1.BadRequestError("This publisher is not linked to any user");
        }
        const user = publisher.user;
        // remove vínculo
        user.publisher = null;
        await userRepository_1.userRepository.save(user);
        return res.json({ message: "Publisher unlinked successfully" });
    }
    async transferPublishers(req, res) {
        const { publisherIds, newCongregationId } = req.body;
        if (!Array.isArray(publisherIds) || publisherIds.length === 0) {
            throw new api_errors_1.BadRequestError("You must send at least one publisherId");
        }
        if (!newCongregationId) {
            throw new api_errors_1.BadRequestError("New congregation is required");
        }
        const newCongregation = await congregationRepository_1.congregationRepository.findOne({
            where: {
                id: newCongregationId,
                type: Congregation_1.CongregationType.SYSTEM,
            },
        });
        if (!newCongregation) {
            throw new api_errors_1.BadRequestError("New congregation does not exist or is not type SYSTEM");
        }
        const results = [];
        await publisherRepository_1.publisherRepository.manager.transaction(async (manager) => {
            var _a, _b;
            const txPublisherRepo = manager.getRepository(Publisher_1.Publisher);
            const txSpeakerRepo = manager.getRepository(Speaker_1.Speaker);
            const txGroupOverseersRepo = manager.getRepository(GroupOverseers_1.GroupOverseers);
            const txHospitalityGroupRepo = manager.getRepository(HospitalityGroup_1.HospitalityGroup);
            const txUserRepo = manager.getRepository(User_1.User);
            for (const publisher_id of publisherIds) {
                const txPublisher = await txPublisherRepo.findOne({
                    where: { id: publisher_id },
                    relations: [
                        "group",
                        "hospitalityGroup",
                        "user",
                        "emergencyContact",
                        "congregation",
                    ],
                });
                if (!txPublisher) {
                    results.push({
                        publisherId: publisher_id,
                        status: "not_found",
                    });
                    continue;
                }
                // Já pertence à mesma congregação
                if (((_a = txPublisher.congregation) === null || _a === void 0 ? void 0 : _a.id) === newCongregationId) {
                    results.push({
                        publisherId: publisher_id,
                        status: "already_in_congregation",
                    });
                    continue;
                }
                // === LIMPEZA DAS RELAÇÕES ===
                // 1 — Grupo
                txPublisher.group = null;
                // 2 — Hospitality Group como host
                const hostGroups = await txHospitalityGroupRepo.find({
                    where: { host: { id: txPublisher.id } },
                });
                for (const hg of hostGroups) {
                    hg.host = null;
                    await txHospitalityGroupRepo.save(hg);
                }
                if (txPublisher.hospitality_group_id) {
                    txPublisher.hospitality_group_id = null;
                }
                txPublisher.hospitalityGroup = null;
                // 3 — Emergency contact
                if (txPublisher.emergencyContact) {
                    txPublisher.emergencyContact = null;
                }
                // 4 — Remove group overseers
                const overseersDeleted = await txGroupOverseersRepo.delete({
                    publisher: { id: txPublisher.id },
                });
                // 5 — Update user congregation
                let userUpdated = false;
                if (txPublisher.user) {
                    const txUser = await txUserRepo.findOne({
                        where: { id: txPublisher.user.id },
                    });
                    if (txUser) {
                        txUser.congregation = { id: newCongregationId };
                        await txUserRepo.save(txUser);
                        userUpdated = true;
                    }
                }
                // 6 — Speakers
                const speakers = await txSpeakerRepo.find({
                    where: { publisher: { id: txPublisher.id } },
                });
                let speakerUpdatedCount = 0;
                for (const sp of speakers) {
                    sp.originCongregation = { id: newCongregationId };
                    sp.publisher = null;
                    await txSpeakerRepo.save(sp);
                    speakerUpdatedCount++;
                }
                // 7 — Define nova congregation
                txPublisher.congregation = { id: newCongregationId };
                txPublisher.groupOverseers = null;
                await txPublisherRepo.save(txPublisher);
                results.push({
                    publisherId: txPublisher.id,
                    status: "transferred",
                    overseersRemoved: (_b = overseersDeleted.affected) !== null && _b !== void 0 ? _b : 0,
                    userUpdated,
                    speakersUpdated: speakerUpdatedCount,
                });
            }
        });
        return res.json({
            message: "Publishers processed.",
            results,
        });
    }
}
exports.default = new PublisherControler();
