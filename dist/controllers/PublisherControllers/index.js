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
const cleaningFunctions_1 = require("../../functions/cleaningFunctions");
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
const privilegesTranslations_1 = require("../../helpers/privilegesTranslations");
const publisherPrivilegeHelper_1 = require("../../helpers/publisherPrivilegeHelper");
const cleaningScheduleRepository_1 = require("../../repositories/cleaningScheduleRepository");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const emergencyContact_1 = require("../../repositories/emergencyContact");
const externalTalkRepository_1 = require("../../repositories/externalTalkRepository");
const fieldServiceScheduleRepository_1 = require("../../repositories/fieldServiceScheduleRepository");
const hospitalityAssignmentRepository_1 = require("../../repositories/hospitalityAssignmentRepository");
const mechanicalAssignmentRepository_1 = require("../../repositories/mechanicalAssignmentRepository");
const midweekMeetingPartRepository_1 = require("../../repositories/midweekMeetingPartRepository");
const midweekScheduleRepository_1 = require("../../repositories/midweekScheduleRepository");
const privilegeRepository_1 = require("../../repositories/privilegeRepository");
const publicWitnessAssignmentRepository_1 = require("../../repositories/publicWitnessAssignmentRepository");
const publisherPrivilegeRepository_1 = require("../../repositories/publisherPrivilegeRepository");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const userRepository_1 = require("../../repositories/userRepository");
const weekendScheduleRepository_1 = require("../../repositories/weekendScheduleRepository");
const mechanical_1 = require("../../types/mechanical");
const privileges_1 = require("../../types/privileges");
class PublisherControler {
    async create(req, res) {
        const { fullName, nickname, privileges, congregation_id, gender, hope, dateImmersed, birthDate, pioneerMonths, startPioneer, startDatePublisher, situation, phone, address, emergencyContact_id, user_id } = req.body;
        if (privileges) {
            if (privileges.includes(privileges_1.Privileges.PIONEIROREGULAR) && !startPioneer) {
                throw new api_errors_1.BadRequestError('You must provide the "startPioneer" field when assigning the "Pioneiro Regular" privilege');
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
            pioneerMonths: pioneerMonths || [],
            congregation,
            startPioneer,
            situation,
            phone,
            address
        });
        if (emergencyContact_id) {
            const contact = await emergencyContact_1.emergencyContactRepository.findOneBy({ id: emergencyContact_id });
            newPublisher.emergencyContact = contact !== null && contact !== void 0 ? contact : null;
        }
        await publisherRepository_1.publisherRepository.save(newPublisher).catch(err => {
            throw new api_errors_1.BadRequestError(err);
        });
        if (privileges === null || privileges === void 0 ? void 0 : privileges.length) {
            for (const privilegePT of privileges) {
                const privilegeEN = privilegesTranslations_1.privilegePTtoEN[privilegePT];
                if (!privilegeEN || privilegeEN === "Auxiliary Pioneer")
                    continue;
                const codeGuess = privilegeEN.toUpperCase().replace(/\s+/g, '_');
                const privilegeEntity = await privilegeRepository_1.privilegeRepository.findOne({
                    where: [{ code: codeGuess }, { name: privilegeEN }]
                });
                if (privilegeEntity) {
                    const isPioneerRole = ["Regular Pioneer", "Continuous Auxiliary Pioneer", "Special Pioneer"].includes(privilegeEN);
                    const isPublisherRole = privilegeEN === "Publisher" || privilegeEntity.code === privileges_1.PrivilegeCode.PUBLISHER;
                    let sDate = null;
                    if (isPioneerRole && startPioneer)
                        sDate = new Date(startPioneer);
                    if (isPublisherRole && startDatePublisher)
                        sDate = new Date(startDatePublisher);
                    await publisherPrivilegeRepository_1.publisherPrivilegeRepository.save({
                        publisher: newPublisher,
                        privilege: privilegeEntity,
                        startDate: sDate,
                        endDate: null
                    });
                }
            }
        }
        if (pioneerMonths === null || pioneerMonths === void 0 ? void 0 : pioneerMonths.length) {
            let auxPrivilege = await privilegeRepository_1.privilegeRepository.findOne({
                where: [{ code: privileges_1.PrivilegeCode.AUXILIARY_PIONEER }, { name: "Auxiliary Pioneer" }]
            });
            if (!auxPrivilege) {
                auxPrivilege = await privilegeRepository_1.privilegeRepository.save({
                    code: privileges_1.PrivilegeCode.AUXILIARY_PIONEER,
                    name: "Auxiliary Pioneer"
                });
            }
            for (const pm of pioneerMonths) {
                const range = (0, privilegesTranslations_1.parsePioneerMonthString)(pm);
                if (range) {
                    await publisherPrivilegeRepository_1.publisherPrivilegeRepository.save({
                        publisher: newPublisher,
                        privilege: auxPrivilege,
                        startDate: new Date(range.startDate + "T00:00:00Z"),
                        endDate: new Date(range.endDate + "T23:59:59Z")
                    });
                }
            }
        }
        if (user_id) {
            const userToLink = await userRepository_1.userRepository.findOne({ where: { id: user_id } });
            if (userToLink) {
                userToLink.publisher = newPublisher;
                await userRepository_1.userRepository.save(userToLink);
            }
        }
        return res.status(201).json(newPublisher);
    }
    async update(req, res) {
        var _a, _b, _c;
        const { publisher_id: id } = req.params;
        const { fullName, nickname, privileges, gender, hope, dateImmersed, birthDate, pioneerMonths, situation, phone, address, startPioneer, startDatePublisher, emergencyContact_id, user_id } = req.body;
        const publisher = await publisherRepository_1.publisherRepository.findOne({
            where: { id },
            relations: ["congregation", "privilegesRelation", "privilegesRelation.privilege"]
        });
        if (!publisher) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.publisher);
        }
        if (privileges) {
            if (privileges.includes(privileges_1.Privileges.PIONEIROREGULAR) && !startPioneer && !publisher.startPioneer) {
                throw new api_errors_1.BadRequestError('You must provide the "startPioneer" field when assigning the "Pioneiro Regular" privilege');
            }
            const privilegesExists = privileges === null || privileges === void 0 ? void 0 : privileges.every(privilege => Object.values(privileges_1.Privileges).includes(privilege));
            if (!privilegesExists) {
                throw new api_errors_1.BadRequestError('Some privilege not exists');
            }
        }
        if (emergencyContact_id) {
            const contact = await emergencyContact_1.emergencyContactRepository.findOneBy({ id: emergencyContact_id });
            publisher.emergencyContact = contact !== null && contact !== void 0 ? contact : null;
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
        const hasPioneerPrivilege = (privileges === null || privileges === void 0 ? void 0 : privileges.includes(privileges_1.Privileges.PIONEIROREGULAR)) ||
            (privileges === null || privileges === void 0 ? void 0 : privileges.includes(privileges_1.Privileges.PIONEIROAUXILIAR)) ||
            (privileges === null || privileges === void 0 ? void 0 : privileges.includes(privileges_1.Privileges.AUXILIARINDETERMINADO)) ||
            (privileges === null || privileges === void 0 ? void 0 : privileges.includes(privileges_1.Privileges.AUXILIARTEMPOINDETERMINADO));
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
        if (privileges && !hasPioneerPrivilege) {
            publisher.startPioneer = null;
        }
        else {
            publisher.startPioneer =
                startPioneer !== undefined
                    ? startPioneer
                    : publisher.startPioneer;
        }
        publisher.phone = phone !== undefined ? phone : publisher.phone;
        publisher.address = address !== undefined ? address : publisher.address;
        await publisherRepository_1.publisherRepository.save(publisher);
        // Sincroniza privilégios contínuos / eclesiásticos
        if (privileges !== undefined) {
            const continuousPrivilegesPT = privileges.filter(p => p !== privileges_1.Privileges.PIONEIROAUXILIAR);
            const continuousPrivilegesEN = (0, privilegesTranslations_1.translatePrivilegesPTToEN)(continuousPrivilegesPT);
            const codesGuess = continuousPrivilegesEN.map(n => n.toUpperCase().replace(/\s+/g, '_'));
            const privilegeEntities = continuousPrivilegesEN.length > 0
                ? await privilegeRepository_1.privilegeRepository.find({
                    where: [
                        { name: (0, typeorm_1.In)(continuousPrivilegesEN) },
                        { code: (0, typeorm_1.In)(codesGuess) }
                    ]
                })
                : [];
            const continuousIds = privilegeEntities.map(p => p.id);
            const currentPrivileges = await publisherPrivilegeRepository_1.publisherPrivilegeRepository.find({
                where: { publisher: { id: publisher.id } },
                relations: ["privilege"]
            });
            // Encerra privilégios que deixaram de existir com endDate para preservar histórico
            for (const cp of currentPrivileges) {
                if (((_a = cp.privilege) === null || _a === void 0 ? void 0 : _a.code) === privileges_1.PrivilegeCode.AUXILIARY_PIONEER || ((_b = cp.privilege) === null || _b === void 0 ? void 0 : _b.name) === "Auxiliary Pioneer")
                    continue;
                if (!continuousIds.includes((_c = cp.privilege) === null || _c === void 0 ? void 0 : _c.id)) {
                    if (!cp.endDate) {
                        cp.endDate = new Date();
                        await publisherPrivilegeRepository_1.publisherPrivilegeRepository.save(cp);
                    }
                }
            }
            for (const privEntity of privilegeEntities) {
                const activeInstance = currentPrivileges.find(cp => { var _a; return ((_a = cp.privilege) === null || _a === void 0 ? void 0 : _a.id) === privEntity.id && !cp.endDate; });
                const isPioneerRole = ["Regular Pioneer", "Continuous Auxiliary Pioneer", "Special Pioneer"].includes(privEntity.name) ||
                    ["REGULAR_PIONEER", "CONTINUOUS_AUXILIARY_PIONEER", "SPECIAL_PIONEER"].includes(privEntity.code);
                const isPublisherRole = ["Publisher"].includes(privEntity.name) || privEntity.code === privileges_1.PrivilegeCode.PUBLISHER;
                if (!activeInstance) {
                    let sDate = null;
                    if (isPioneerRole) {
                        sDate = publisher.startPioneer ? new Date(publisher.startPioneer) : new Date();
                    }
                    else if (isPublisherRole) {
                        sDate = startDatePublisher ? new Date(startDatePublisher) : null;
                    }
                    else {
                        sDate = new Date();
                    }
                    await publisherPrivilegeRepository_1.publisherPrivilegeRepository.save({
                        publisher,
                        privilege: privEntity,
                        startDate: sDate,
                        endDate: null
                    });
                }
                else {
                    if (isPioneerRole && startPioneer !== undefined) {
                        activeInstance.startDate = startPioneer ? new Date(startPioneer) : null;
                        await publisherPrivilegeRepository_1.publisherPrivilegeRepository.save(activeInstance);
                    }
                    else if (isPublisherRole && startDatePublisher !== undefined) {
                        activeInstance.startDate = startDatePublisher ? new Date(startDatePublisher) : null;
                        await publisherPrivilegeRepository_1.publisherPrivilegeRepository.save(activeInstance);
                    }
                }
            }
        }
        // Sincroniza meses discretos de Pioneiro Auxiliar se pioneerMonths foi enviado
        if (pioneerMonths !== undefined) {
            let auxPrivilege = await privilegeRepository_1.privilegeRepository.findOne({
                where: [{ code: privileges_1.PrivilegeCode.AUXILIARY_PIONEER }, { name: "Auxiliary Pioneer" }]
            });
            if (!auxPrivilege) {
                auxPrivilege = await privilegeRepository_1.privilegeRepository.save({
                    code: privileges_1.PrivilegeCode.AUXILIARY_PIONEER,
                    name: "Auxiliary Pioneer"
                });
            }
            const existingAuxPrivs = await publisherPrivilegeRepository_1.publisherPrivilegeRepository.find({
                where: { publisher: { id: publisher.id }, privilege: { id: auxPrivilege.id } }
            });
            const targetRanges = pioneerMonths
                .map(pm => (0, privilegesTranslations_1.parsePioneerMonthString)(pm))
                .filter((r) => r !== null);
            for (const ep of existingAuxPrivs) {
                const epStartStr = (0, dayjs_1.default)(ep.startDate).format("YYYY-MM-DD");
                const epEndStr = (0, dayjs_1.default)(ep.endDate).format("YYYY-MM-DD");
                const match = targetRanges.find(tr => tr.startDate === epStartStr && tr.endDate === epEndStr);
                if (!match) {
                    await publisherPrivilegeRepository_1.publisherPrivilegeRepository.remove(ep);
                }
            }
            for (const tr of targetRanges) {
                const alreadyExists = existingAuxPrivs.some(ep => {
                    const epStartStr = (0, dayjs_1.default)(ep.startDate).format("YYYY-MM-DD");
                    const epEndStr = (0, dayjs_1.default)(ep.endDate).format("YYYY-MM-DD");
                    return epStartStr === tr.startDate && epEndStr === tr.endDate;
                });
                if (!alreadyExists) {
                    await publisherPrivilegeRepository_1.publisherPrivilegeRepository.save({
                        publisher,
                        privilege: auxPrivilege,
                        startDate: new Date(tr.startDate + "T00:00:00Z"),
                        endDate: new Date(tr.endDate + "T23:59:59Z")
                    });
                }
            }
        }
        if (user_id !== undefined) {
            if (user_id === null) {
                const currentUser = await userRepository_1.userRepository.findOne({ where: { publisher: { id: publisher.id } } });
                if (currentUser) {
                    currentUser.publisher = null;
                    await userRepository_1.userRepository.save(currentUser);
                }
            }
            else {
                const userToLink = await userRepository_1.userRepository.findOne({ where: { id: user_id } });
                if (userToLink) {
                    const currentUser = await userRepository_1.userRepository.findOne({ where: { publisher: { id: publisher.id } } });
                    if (currentUser && currentUser.id !== userToLink.id) {
                        currentUser.publisher = null;
                        await userRepository_1.userRepository.save(currentUser);
                    }
                    userToLink.publisher = publisher;
                    await userRepository_1.userRepository.save(userToLink);
                }
            }
        }
        return res.status(200).json(publisher);
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
            }, relations: ['group', 'congregation', "emergencyContact", "hospitalityGroup", "privilegesRelation", "privilegesRelation.privilege"]
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
            relations: ["congregation", "privilegesRelation", "privilegesRelation.privilege"],
        });
        const validPublishers = publishers.filter(p => (0, publisherPrivilegeHelper_1.hasPrivilege)(p, privileges_1.PrivilegeCode.PUBLISHER) &&
            p.situation !== Publisher_1.Situation.Removido &&
            p.situation !== Publisher_1.Situation.Desassociado);
        const publishersNames = validPublishers.map(publisher => ({
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
            relations: ["user", "emergencyContact", "congregation", "group", "privilegesRelation", "privilegesRelation.privilege"],
        });
        if (!publisher)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.publisher);
        return res.status(200).json(publisher);
    }
    async getAuxiliaryPioneersByMonth(req, res) {
        const { congregation_id } = req.params;
        const { month, year } = req.query;
        if (!month || !year) {
            throw new api_errors_1.BadRequestError("Parâmetros 'month' e 'year' são obrigatórios");
        }
        const range = (0, privilegesTranslations_1.getMonthDateRange)(month, year);
        if (!range) {
            throw new api_errors_1.BadRequestError("Mês ou ano inválido");
        }
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        }
        const formattedLegacyMonth = `${privilegesTranslations_1.PT_MONTH_NAMES[range.monthIndex]}-${year}`;
        const allPublishers = await publisherRepository_1.publisherRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["privilegesRelation", "privilegesRelation.privilege"]
        });
        const result = allPublishers
            .filter(pub => {
            var _a, _b, _c, _d, _e;
            const isContinuous = ((_a = pub.privileges) === null || _a === void 0 ? void 0 : _a.includes("Auxiliar por Tempo Indeterminado")) ||
                ((_b = pub.privileges) === null || _b === void 0 ? void 0 : _b.includes("Auxiliar Indeterminado")) ||
                ((_c = pub.privilegesRelation) === null || _c === void 0 ? void 0 : _c.some(pp => { var _a; return ((_a = pp.privilege) === null || _a === void 0 ? void 0 : _a.name) === "Continuous Auxiliary Pioneer"; }));
            const isMonthAux = ((_d = pub.pioneerMonths) === null || _d === void 0 ? void 0 : _d.some(pm => pm.trim().toLowerCase() === formattedLegacyMonth.toLowerCase())) ||
                ((_e = pub.privilegesRelation) === null || _e === void 0 ? void 0 : _e.some(pp => {
                    var _a;
                    return ((_a = pp.privilege) === null || _a === void 0 ? void 0 : _a.name) === "Auxiliary Pioneer" &&
                        (0, dayjs_1.default)(pp.startDate).format("YYYY-MM-DD") <= range.endDate &&
                        (0, dayjs_1.default)(pp.endDate).format("YYYY-MM-DD") >= range.startDate;
                }));
            return isContinuous || isMonthAux;
        })
            .map(pub => {
            var _a, _b, _c;
            const isContinuous = ((_a = pub.privileges) === null || _a === void 0 ? void 0 : _a.includes("Auxiliar por Tempo Indeterminado")) ||
                ((_b = pub.privileges) === null || _b === void 0 ? void 0 : _b.includes("Auxiliar Indeterminado")) ||
                ((_c = pub.privilegesRelation) === null || _c === void 0 ? void 0 : _c.some(pp => { var _a; return ((_a = pp.privilege) === null || _a === void 0 ? void 0 : _a.name) === "Continuous Auxiliary Pioneer"; }));
            return {
                publisherId: pub.id,
                fullName: pub.fullName,
                nickname: pub.nickname,
                privilegeName: isContinuous ? "Continuous Auxiliary Pioneer" : "Auxiliary Pioneer",
                isContinuous,
            };
        });
        return res.status(200).json(result);
    }
    async setAuxiliaryPioneersByMonth(req, res) {
        var _a;
        const { congregation_id } = req.params;
        const { month, year, publisherIds } = req.body;
        const range = (0, privilegesTranslations_1.getMonthDateRange)(month, year);
        if (!range) {
            throw new api_errors_1.BadRequestError("Mês ou ano inválido");
        }
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        }
        let auxPrivilege = await privilegeRepository_1.privilegeRepository.findOneBy({ name: "Auxiliary Pioneer" });
        if (!auxPrivilege) {
            auxPrivilege = await privilegeRepository_1.privilegeRepository.save({ name: "Auxiliary Pioneer" });
        }
        const formattedLegacyMonth = `${privilegesTranslations_1.PT_MONTH_NAMES[range.monthIndex]}-${year}`;
        const allPublishers = await publisherRepository_1.publisherRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["privilegesRelation", "privilegesRelation.privilege"]
        });
        for (const pub of allPublishers) {
            const shouldBeAux = publisherIds.includes(pub.id);
            const existingAuxPrivilege = (_a = pub.privilegesRelation) === null || _a === void 0 ? void 0 : _a.find(pp => {
                var _a;
                return ((_a = pp.privilege) === null || _a === void 0 ? void 0 : _a.name) === "Auxiliary Pioneer" &&
                    (0, dayjs_1.default)(pp.startDate).format("YYYY-MM-DD") === range.startDate &&
                    (0, dayjs_1.default)(pp.endDate).format("YYYY-MM-DD") === range.endDate;
            });
            let pubMonths = pub.pioneerMonths ? [...pub.pioneerMonths] : [];
            let pubPrivileges = pub.privileges ? [...pub.privileges] : [];
            let updated = false;
            if (shouldBeAux) {
                if (!existingAuxPrivilege) {
                    const newPriv = await publisherPrivilegeRepository_1.publisherPrivilegeRepository.save({
                        publisher: pub,
                        publisherId: pub.id,
                        privilege: auxPrivilege,
                        privilegeId: auxPrivilege.id,
                        startDate: range.startDate,
                        endDate: range.endDate
                    });
                    if (!pub.privilegesRelation) {
                        pub.privilegesRelation = [];
                    }
                    pub.privilegesRelation.push(newPriv);
                }
                if (!pubMonths.some(pm => pm.trim().toLowerCase() === formattedLegacyMonth.toLowerCase())) {
                    pubMonths.push(formattedLegacyMonth);
                    pub.pioneerMonths = pubMonths;
                    updated = true;
                }
                if (!pubPrivileges.includes("Pioneiro Auxiliar")) {
                    pubPrivileges.push("Pioneiro Auxiliar");
                    pub.privileges = pubPrivileges;
                    updated = true;
                }
            }
            else {
                if (existingAuxPrivilege) {
                    await publisherPrivilegeRepository_1.publisherPrivilegeRepository.remove(existingAuxPrivilege);
                    pub.privilegesRelation = pub.privilegesRelation.filter(pp => pp.id !== existingAuxPrivilege.id);
                }
                if (pubMonths.some(pm => pm.trim().toLowerCase() === formattedLegacyMonth.toLowerCase())) {
                    pubMonths = pubMonths.filter(m => m.trim().toLowerCase() !== formattedLegacyMonth.toLowerCase());
                    pub.pioneerMonths = pubMonths;
                    updated = true;
                }
                if (pubMonths.length === 0 && pubPrivileges.includes("Pioneiro Auxiliar")) {
                    pubPrivileges = pubPrivileges.filter(p => p !== "Pioneiro Auxiliar");
                    pub.privileges = pubPrivileges;
                    updated = true;
                }
            }
            if (updated) {
                await publisherRepository_1.publisherRepository.update(pub.id, {
                    pioneerMonths: pubMonths,
                    privileges: pubPrivileges
                });
            }
        }
        return res.status(200).json({ success: true, count: publisherIds.length });
    }
    async getAssignmentPublisher(req, res) {
        var _a, _b, _c, _d, _e;
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
            var _a, _b, _c, _d, _e, _f;
            const pubCongId = (_a = publisher.congregation) === null || _a === void 0 ? void 0 : _a.id;
            const sCongId = (_b = s.congregation) === null || _b === void 0 ? void 0 : _b.id;
            if (((_c = s.chairman) === null || _c === void 0 ? void 0 : _c.id) === publisher_id && sCongId && pubCongId && sCongId === pubCongId) {
                return {
                    role: "Presidente",
                    date: s.date,
                };
            }
            if (((_d = s.reader) === null || _d === void 0 ? void 0 : _d.id) === publisher_id && sCongId && pubCongId && sCongId === pubCongId) {
                return {
                    role: "Leitor",
                    date: s.date,
                };
            }
            if (((_f = (_e = s.speaker) === null || _e === void 0 ? void 0 : _e.publisher) === null || _f === void 0 ? void 0 : _f.id) === publisher_id) {
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
            var _a, _b, _c, _d, _e, _f, _g;
            return ({
                role: "Discurso Externo",
                date: e.date,
                status: e.status,
                talk: e.talk ? e.talk : e.manualTalk,
                destinationCongregation: e.destinationCongregation ? {
                    name: (_a = e.destinationCongregation) === null || _a === void 0 ? void 0 : _a.name,
                    city: (_b = e.destinationCongregation) === null || _b === void 0 ? void 0 : _b.city,
                    address: (_c = e.destinationCongregation) === null || _c === void 0 ? void 0 : _c.address,
                    latitude: (_d = e.destinationCongregation) === null || _d === void 0 ? void 0 : _d.latitude,
                    longitude: (_e = e.destinationCongregation) === null || _e === void 0 ? void 0 : _e.longitude,
                    dayMeetingPublic: (_f = e.destinationCongregation) === null || _f === void 0 ? void 0 : _f.dayMeetingPublic,
                    hourMeetingPublic: (_g = e.destinationCongregation) === null || _g === void 0 ? void 0 : _g.hourMeetingPublic,
                } : null,
            });
        });
        // 🔹 Mapeia designações da Reunião de Meio de Semana (Funções Gerais)
        const todayStr = (0, dayjs_1.default)().format("YYYY-MM-DD");
        const getMidweekMeetingDate = (weekDate, explicitMeetingDate, cong) => {
            var _a;
            if (explicitMeetingDate && explicitMeetingDate !== weekDate) {
                return explicitMeetingDate;
            }
            const congMeetingDay = (cong === null || cong === void 0 ? void 0 : cong.dayMeetingLifeAndMinistary) || ((_a = publisher.congregation) === null || _a === void 0 ? void 0 : _a.dayMeetingLifeAndMinistary);
            if (congMeetingDay) {
                const isoDay = (0, cleaningFunctions_1.convertMeetingDayPortugueseToIso)(congMeetingDay);
                return (0, dayjs_1.default)(weekDate).add(isoDay - 1, "day").format("YYYY-MM-DD");
            }
            return explicitMeetingDate || weekDate;
        };
        const midweekSchedules = await midweekScheduleRepository_1.midweekScheduleRepository.find({
            where: [
                { chairman_id: publisher_id, meetingDate: (0, typeorm_1.MoreThanOrEqual)(todayStr) },
                { chairman_id: publisher_id, weekDate: (0, typeorm_1.MoreThanOrEqual)(todayStr) },
                { opening_prayer_id: publisher_id, meetingDate: (0, typeorm_1.MoreThanOrEqual)(todayStr) },
                { opening_prayer_id: publisher_id, weekDate: (0, typeorm_1.MoreThanOrEqual)(todayStr) },
                { closing_prayer_id: publisher_id, meetingDate: (0, typeorm_1.MoreThanOrEqual)(todayStr) },
                { closing_prayer_id: publisher_id, weekDate: (0, typeorm_1.MoreThanOrEqual)(todayStr) },
                { aux_counselor_1_id: publisher_id, meetingDate: (0, typeorm_1.MoreThanOrEqual)(todayStr) },
                { aux_counselor_1_id: publisher_id, weekDate: (0, typeorm_1.MoreThanOrEqual)(todayStr) },
                { aux_counselor_2_id: publisher_id, meetingDate: (0, typeorm_1.MoreThanOrEqual)(todayStr) },
                { aux_counselor_2_id: publisher_id, weekDate: (0, typeorm_1.MoreThanOrEqual)(todayStr) },
                { cbs_conductor_id: publisher_id, meetingDate: (0, typeorm_1.MoreThanOrEqual)(todayStr) },
                { cbs_conductor_id: publisher_id, weekDate: (0, typeorm_1.MoreThanOrEqual)(todayStr) },
                { cbs_reader_id: publisher_id, meetingDate: (0, typeorm_1.MoreThanOrEqual)(todayStr) },
                { cbs_reader_id: publisher_id, weekDate: (0, typeorm_1.MoreThanOrEqual)(todayStr) },
            ],
            relations: ["congregation"],
            order: { meetingDate: "ASC" }
        });
        const midweekGeneralAssignments = [];
        const uniqueMidweekSchedules = Array.from(new Map(midweekSchedules.map(s => [s.id, s])).values());
        for (const s of uniqueMidweekSchedules) {
            if (s.isSpecial && s.specialType !== "NONE" && s.specialType !== "CIRCUIT_OVERSEER_VISIT") {
                continue;
            }
            const schedDate = getMidweekMeetingDate(s.weekDate, s.meetingDate, s.congregation);
            if (schedDate < todayStr)
                continue;
            if (s.chairman_id === publisher_id) {
                midweekGeneralAssignments.push({
                    role: "Presidente",
                    title: "Reunião de Meio de Semana",
                    date: schedDate
                });
            }
            if (s.opening_prayer_id === publisher_id) {
                midweekGeneralAssignments.push({
                    role: "Oração Inicial",
                    title: "Reunião de Meio de Semana",
                    date: schedDate
                });
            }
            if (s.closing_prayer_id === publisher_id) {
                midweekGeneralAssignments.push({
                    role: "Oração Final",
                    title: "Reunião de Meio de Semana",
                    date: schedDate
                });
            }
            if (s.aux_counselor_1_id === publisher_id) {
                midweekGeneralAssignments.push({
                    role: "Conselheiro",
                    title: "Sala Auxiliar 1",
                    room: "Sala Auxiliar 1",
                    date: schedDate
                });
            }
            if (s.aux_counselor_2_id === publisher_id) {
                midweekGeneralAssignments.push({
                    role: "Conselheiro",
                    title: "Sala Auxiliar 2",
                    room: "Sala Auxiliar 2",
                    date: schedDate
                });
            }
            if (s.cbs_conductor_id === publisher_id) {
                midweekGeneralAssignments.push({
                    role: "Dirigente do Estudo Bíblico",
                    title: "Estudo Bíblico de Congregação",
                    date: schedDate
                });
            }
            if (s.cbs_reader_id === publisher_id) {
                midweekGeneralAssignments.push({
                    role: "Leitor do Estudo Bíblico",
                    title: "Estudo Bíblico de Congregação",
                    date: schedDate
                });
            }
        }
        // 🔹 Mapeia partes de estudantes e discursos do Meio de Semana
        const midweekParts = await midweekMeetingPartRepository_1.midweekMeetingPartRepository.find({
            where: [
                { assigned_publisher_id: publisher_id, isActive: true },
                { assistant_publisher_id: publisher_id, isActive: true }
            ],
            relations: [
                "schedule",
                "schedule.congregation",
                "assignedPublisher",
                "assistantPublisher"
            ]
        });
        const midweekPartAssignments = [];
        for (const part of midweekParts) {
            if (!part.schedule)
                continue;
            if (part.schedule.isSpecial && part.schedule.specialType !== "NONE" && part.schedule.specialType !== "CIRCUIT_OVERSEER_VISIT") {
                continue;
            }
            const partDate = getMidweekMeetingDate(part.schedule.weekDate, part.schedule.meetingDate, part.schedule.congregation);
            if (partDate < todayStr)
                continue;
            const roomName = part.room === "AUXILIARY_1" ? "Sala Auxiliar 1" : part.room === "AUXILIARY_2" ? "Sala Auxiliar 2" : "Sala Principal";
            if (part.assigned_publisher_id === publisher_id) {
                const asstName = ((_a = part.assistantPublisher) === null || _a === void 0 ? void 0 : _a.nickname) || ((_b = part.assistantPublisher) === null || _b === void 0 ? void 0 : _b.fullName);
                midweekPartAssignments.push({
                    role: "Meio de Semana",
                    title: part.title,
                    room: roomName,
                    partner: asstName || undefined,
                    date: partDate,
                    section: part.section,
                    timeMinutes: part.timeMinutes,
                    partType: part.partType
                });
            }
            if (part.assistant_publisher_id === publisher_id) {
                const studentName = ((_c = part.assignedPublisher) === null || _c === void 0 ? void 0 : _c.nickname) || ((_d = part.assignedPublisher) === null || _d === void 0 ? void 0 : _d.fullName);
                midweekPartAssignments.push({
                    role: "Ajudante (Meio de Semana)",
                    title: part.title,
                    room: roomName,
                    partner: studentName || undefined,
                    date: partDate,
                    section: part.section,
                    timeMinutes: part.timeMinutes,
                    partType: part.partType
                });
            }
        }
        // 🔹 Mapeia designações de partes mecânicas
        const mechanicalAssignmentsQuery = mechanicalAssignmentRepository_1.mechanicalAssignmentRepository
            .createQueryBuilder("ma")
            .innerJoinAndSelect("ma.schedule", "sched")
            .where("ma.publisher_id = :publisher_id", { publisher_id })
            .andWhere("sched.date >= :todayStr", { todayStr });
        if ((_e = publisher.congregation) === null || _e === void 0 ? void 0 : _e.id) {
            mechanicalAssignmentsQuery.andWhere("sched.congregation_id = :congregation_id", {
                congregation_id: publisher.congregation.id
            });
        }
        const mechanicalAssignments = await mechanicalAssignmentsQuery
            .orderBy("sched.date", "ASC")
            .addOrderBy("ma.order", "ASC")
            .getMany();
        const mechanicalAssignmentsMapped = mechanicalAssignments
            .filter(ma => ma.schedule && !ma.schedule.hasNoMeeting)
            .map(ma => {
            const roleLabel = mechanical_1.MechanicalRoleLabels[ma.role] || ma.role;
            const roleWithOrder = ma.order && ma.order > 1 && (ma.role === mechanical_1.MechanicalRole.ATTENDANT || ma.role === mechanical_1.MechanicalRole.ROVING_MIC || ma.role === mechanical_1.MechanicalRole.STAGE_MIC)
                ? `${roleLabel} ${ma.order}`
                : roleLabel;
            return {
                id: ma.id,
                role: "Tarefa Mecânica",
                title: roleWithOrder,
                mechanicalRole: ma.role,
                mechanicalRoleLabel: roleLabel,
                order: ma.order,
                meetingType: ma.schedule.meetingType,
                date: ma.schedule.date
            };
        });
        const allAssignments = [
            ...assignments,
            ...hospitalityAssignments,
            ...externalAssignments,
            ...cleaningAssignments,
            ...fieldServiceRotationMapped,
            ...publicWitnessMapped,
            ...midweekGeneralAssignments,
            ...midweekPartAssignments,
            ...mechanicalAssignmentsMapped
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
