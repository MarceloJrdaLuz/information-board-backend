"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MechanicalScheduleService = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const isBetween_1 = __importDefault(require("dayjs/plugin/isBetween"));
const midweekEnums_1 = require("../../entities/midweekEnums");
const Publisher_1 = require("../../entities/Publisher");
const api_errors_1 = require("../../helpers/api-errors");
const mechanicalAssignmentRepository_1 = require("../../repositories/mechanicalAssignmentRepository");
const mechanicalScheduleConfigRepository_1 = require("../../repositories/mechanicalScheduleConfigRepository");
const mechanicalScheduleRepository_1 = require("../../repositories/mechanicalScheduleRepository");
const midweekScheduleRepository_1 = require("../../repositories/midweekScheduleRepository");
const privilegeRepository_1 = require("../../repositories/privilegeRepository");
const publisherPrivilegeRepository_1 = require("../../repositories/publisherPrivilegeRepository");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const mechanical_1 = require("../../types/mechanical");
dayjs_1.default.extend(isBetween_1.default);
class MechanicalScheduleService {
    async getConfig(congregationId) {
        let config = await mechanicalScheduleConfigRepository_1.mechanicalScheduleConfigRepository.findOne({
            where: { congregation_id: congregationId }
        });
        if (!config) {
            config = mechanicalScheduleConfigRepository_1.mechanicalScheduleConfigRepository.create({
                congregation_id: congregationId,
                combineSoundAndMedia: false,
                midweekAttendantsCount: 2,
                midweekSoundCount: 1,
                midweekMediaCount: 1,
                midweekRovingMicsCount: 2,
                midweekStageMicsCount: 1,
                weekendAttendantsCount: 2,
                weekendSoundCount: 1,
                weekendMediaCount: 1,
                weekendRovingMicsCount: 2,
                weekendStageMicsCount: 1
            });
            await mechanicalScheduleConfigRepository_1.mechanicalScheduleConfigRepository.save(config);
        }
        return config;
    }
    async saveConfig(congregationId, data) {
        const config = await this.getConfig(congregationId);
        Object.assign(config, data);
        return await mechanicalScheduleConfigRepository_1.mechanicalScheduleConfigRepository.save(config);
    }
    async getMonthSchedules(congregationId, year, month, monthsCount = 1) {
        const startOfMonth = (0, dayjs_1.default)(`${year}-${String(month).padStart(2, "0")}-01`);
        const safeMonths = Math.min(Math.max(monthsCount, 1), 6);
        const endOfMonth = startOfMonth.add(safeMonths - 1, "month").endOf("month");
        // Semana começa na segunda-feira antes ou no primeiro dia do mês inicial
        const firstWeekMonday = startOfMonth.startOf("isoWeek").format("YYYY-MM-DD");
        const lastWeekSunday = endOfMonth.endOf("isoWeek").format("YYYY-MM-DD");
        const schedules = await mechanicalScheduleRepository_1.mechanicalScheduleRepository
            .createQueryBuilder("sched")
            .leftJoinAndSelect("sched.assignments", "assignments")
            .leftJoinAndSelect("assignments.publisher", "publisher")
            .where("sched.congregation_id = :congregationId", { congregationId })
            .andWhere("sched.date >= :startDate AND sched.date <= :endDate", {
            startDate: firstWeekMonday,
            endDate: lastWeekSunday
        })
            .orderBy("sched.date", "ASC")
            .addOrderBy("assignments.order", "ASC")
            .getMany();
        // Busca registros de MidweekSchedule no mesmo período para detectar eventos especiais
        const midweekSchedules = await midweekScheduleRepository_1.midweekScheduleRepository
            .createQueryBuilder("mid")
            .where("mid.congregation_id = :congregationId", { congregationId })
            .andWhere("mid.weekDate >= :startDate AND mid.weekDate <= :endDate", {
            startDate: firstWeekMonday,
            endDate: lastWeekSunday
        })
            .getMany();
        // Agrupa por semana (weekStartDate)
        const weeksMap = new Map();
        for (const s of schedules) {
            const weekKey = s.weekStartDate;
            if (!weeksMap.has(weekKey)) {
                weeksMap.set(weekKey, []);
            }
            weeksMap.get(weekKey).push(s);
        }
        // Garante que todas as semanas do período existam
        let curMonday = (0, dayjs_1.default)(firstWeekMonday);
        const endSun = (0, dayjs_1.default)(lastWeekSunday);
        const allWeekKeys = [];
        while (curMonday.isBefore(endSun)) {
            allWeekKeys.push(curMonday.format("YYYY-MM-DD"));
            curMonday = curMonday.add(1, "week");
        }
        const weeks = allWeekKeys.map((weekStartDate) => {
            var _a;
            const monday = (0, dayjs_1.default)(weekStartDate);
            const sunday = monday.add(6, "day");
            const weekSchedules = weeksMap.get(weekStartDate) || [];
            // Verifica se a semana foi explicitamente marcada nas partes mecânicas
            const hasExplicitSetting = weekSchedules.length > 0;
            const explicitNoMeeting = hasExplicitSetting && weekSchedules.every(s => s.hasNoMeeting);
            const explicitEventTitle = ((_a = weekSchedules.find(s => s.eventTitle)) === null || _a === void 0 ? void 0 : _a.eventTitle) || null;
            // Verifica se há evento especial registrado no midweek
            const mid = midweekSchedules.find(m => m.weekDate === weekStartDate);
            const isMidweekSpecialNoMeeting = (mid === null || mid === void 0 ? void 0 : mid.isSpecial) === true &&
                (mid === null || mid === void 0 ? void 0 : mid.specialType) !== midweekEnums_1.MidweekSpecialType.NONE &&
                (mid === null || mid === void 0 ? void 0 : mid.specialType) !== midweekEnums_1.MidweekSpecialType.CIRCUIT_OVERSEER_VISIT;
            let fallbackEventTitle = null;
            if (isMidweekSpecialNoMeeting) {
                if ((mid === null || mid === void 0 ? void 0 : mid.specialName) && mid.specialName.trim()) {
                    fallbackEventTitle = mid.specialName.trim();
                }
                else if ((mid === null || mid === void 0 ? void 0 : mid.specialType) === midweekEnums_1.MidweekSpecialType.CIRCUIT_ASSEMBLY) {
                    fallbackEventTitle = "Assembleia de Circuito";
                }
                else if ((mid === null || mid === void 0 ? void 0 : mid.specialType) === midweekEnums_1.MidweekSpecialType.REGIONAL_CONVENTION) {
                    fallbackEventTitle = "Congresso Regional";
                }
                else if ((mid === null || mid === void 0 ? void 0 : mid.specialType) === midweekEnums_1.MidweekSpecialType.MEMORIAL) {
                    fallbackEventTitle = "Celebração da Morte de Cristo";
                }
                else {
                    fallbackEventTitle = "Evento Especial";
                }
            }
            const isManuallyActivated = weekSchedules.some(s => s.notes === "MANUALLY_ACTIVATED");
            const isManuallyDeactivated = weekSchedules.some(s => s.hasNoMeeting);
            let hasNoMeeting = false;
            let eventTitle = null;
            if (isManuallyActivated) {
                hasNoMeeting = false;
                eventTitle = null;
            }
            else if (isManuallyDeactivated) {
                hasNoMeeting = true;
                eventTitle = explicitEventTitle || fallbackEventTitle || "Sem Reunião";
            }
            else if (isMidweekSpecialNoMeeting) {
                hasNoMeeting = true;
                eventTitle = fallbackEventTitle;
            }
            else {
                hasNoMeeting = false;
                eventTitle = null;
            }
            return {
                weekStartDate,
                weekEndDate: sunday.format("YYYY-MM-DD"),
                formattedWeek: `Semana de ${monday.format("DD/MM")} a ${sunday.format("DD/MM/YYYY")}`,
                hasNoMeeting,
                eventTitle,
                schedules: weekSchedules
            };
        });
        return {
            year,
            month,
            monthsCount: safeMonths,
            weeks,
            schedules
        };
    }
    async toggleWeekMeeting(congregationId, weekStartDate, hasNoMeeting, eventTitle) {
        const monday = (0, dayjs_1.default)(weekStartDate);
        const { congregationRepository } = await Promise.resolve().then(() => __importStar(require("../../repositories/congregationRepository")));
        const congregation = await congregationRepository.findOne({ where: { id: congregationId } });
        if (!congregation) {
            throw new api_errors_1.NotFoundError("Congregação não encontrada.");
        }
        const { convertMeetingDayPortugueseToIso } = await Promise.resolve().then(() => __importStar(require("../../functions/cleaningFunctions")));
        const midweekDayOfWeek = congregation.dayMeetingLifeAndMinistary
            ? convertMeetingDayPortugueseToIso(congregation.dayMeetingLifeAndMinistary)
            : 3;
        const weekendDayOfWeek = congregation.dayMeetingPublic
            ? convertMeetingDayPortugueseToIso(congregation.dayMeetingPublic)
            : 7;
        const midweekDate = monday.isoWeekday(midweekDayOfWeek).format("YYYY-MM-DD");
        const weekendDate = monday.isoWeekday(weekendDayOfWeek).format("YYYY-MM-DD");
        const meetingInfos = [
            { date: midweekDate, type: mechanical_1.MechanicalMeetingType.MIDWEEK },
            { date: weekendDate, type: mechanical_1.MechanicalMeetingType.WEEKEND }
        ];
        const updatedSchedules = [];
        for (const info of meetingInfos) {
            let sched = await mechanicalScheduleRepository_1.mechanicalScheduleRepository.findOne({
                where: {
                    congregation_id: congregationId,
                    date: info.date
                },
                relations: ["assignments"]
            });
            if (!sched) {
                sched = mechanicalScheduleRepository_1.mechanicalScheduleRepository.create({
                    congregation_id: congregationId,
                    weekStartDate,
                    date: info.date,
                    meetingType: info.type,
                    hasNoMeeting,
                    eventTitle: hasNoMeeting ? (eventTitle || null) : null,
                    notes: !hasNoMeeting ? "MANUALLY_ACTIVATED" : null,
                    assignments: []
                });
            }
            else {
                sched.hasNoMeeting = hasNoMeeting;
                sched.eventTitle = hasNoMeeting ? (eventTitle || null) : null;
                sched.notes = !hasNoMeeting ? "MANUALLY_ACTIVATED" : null;
            }
            // Se marcou como sem reunião, remove todas as atribuições
            if (hasNoMeeting && sched.id) {
                await mechanicalAssignmentRepository_1.mechanicalAssignmentRepository.delete({ schedule_id: sched.id });
                sched.assignments = [];
            }
            await mechanicalScheduleRepository_1.mechanicalScheduleRepository.save(sched);
            updatedSchedules.push(sched);
        }
        return {
            success: true,
            weekStartDate,
            hasNoMeeting,
            eventTitle: eventTitle || null,
            schedules: updatedSchedules
        };
    }
    async updateAssignment(assignmentId, publisherId) {
        var _a;
        const assignment = await mechanicalAssignmentRepository_1.mechanicalAssignmentRepository.findOne({
            where: { id: assignmentId },
            relations: ["schedule", "publisher"]
        });
        if (!assignment) {
            throw new api_errors_1.NotFoundError("Designação não encontrada.");
        }
        assignment.publisher_id = publisherId;
        assignment.isManual = true;
        await mechanicalAssignmentRepository_1.mechanicalAssignmentRepository.save(assignment);
        // Se a congregação usa a mesma equipe a semana toda, sincroniza com a reunião irmã da mesma semana
        const config = await this.getConfig(assignment.schedule.congregation_id);
        if (config.sameTeamWholeWeek) {
            const siblingSchedule = await mechanicalScheduleRepository_1.mechanicalScheduleRepository.findOne({
                where: {
                    congregation_id: assignment.schedule.congregation_id,
                    weekStartDate: assignment.schedule.weekStartDate
                },
                relations: ["assignments"]
            });
            // Se encontrou reunião irmã na mesma semana (ex: fim de semana se alterou meio de semana, ou vice-versa)
            const otherSchedules = await mechanicalScheduleRepository_1.mechanicalScheduleRepository.find({
                where: {
                    congregation_id: assignment.schedule.congregation_id,
                    weekStartDate: assignment.schedule.weekStartDate
                },
                relations: ["assignments"]
            });
            for (const sched of otherSchedules) {
                if (sched.id === assignment.schedule.id)
                    continue;
                let siblingAssignment = (_a = sched.assignments) === null || _a === void 0 ? void 0 : _a.find(a => a.role === assignment.role && a.order === assignment.order);
                if (!siblingAssignment) {
                    siblingAssignment = mechanicalAssignmentRepository_1.mechanicalAssignmentRepository.create({
                        schedule_id: sched.id,
                        role: assignment.role,
                        order: assignment.order,
                        publisher_id: publisherId,
                        isManual: true
                    });
                }
                else {
                    siblingAssignment.publisher_id = publisherId;
                    siblingAssignment.isManual = true;
                }
                await mechanicalAssignmentRepository_1.mechanicalAssignmentRepository.save(siblingAssignment);
            }
        }
        return await mechanicalAssignmentRepository_1.mechanicalAssignmentRepository.findOne({
            where: { id: assignmentId },
            relations: ["schedule", "publisher"]
        });
    }
    async getPublisherSuggestionsForRole(role, scheduleId, congregationId) {
        var _a;
        const schedule = await mechanicalScheduleRepository_1.mechanicalScheduleRepository.findOne({
            where: { id: scheduleId, congregation_id: congregationId },
            relations: ["assignments"]
        });
        if (!schedule) {
            throw new api_errors_1.NotFoundError("Reunião não encontrada.");
        }
        const meetingDate = schedule.date;
        const targetDateObj = (0, dayjs_1.default)(meetingDate);
        // Busca o presidente do meio de semana da mesma semana
        const midweekSched = await midweekScheduleRepository_1.midweekScheduleRepository.findOne({
            where: {
                congregation_id: congregationId,
                weekDate: schedule.weekStartDate
            }
        });
        const midweekChairmanId = (midweekSched === null || midweekSched === void 0 ? void 0 : midweekSched.chairman_id) || null;
        // Publicadores ativos varões da congregação
        const publishers = await publisherRepository_1.publisherRepository.find({
            where: {
                congregation: { id: congregationId },
                situation: Publisher_1.Situation.Ativo,
                gender: Publisher_1.Gender.Masculino
            },
            relations: ["privilegesRelation", "privilegesRelation.privilege", "unavailabilities"]
        });
        // Quem já está designado nesta mesma reunião
        const assignedInThisMeeting = new Set();
        for (const a of schedule.assignments) {
            if (a.publisher_id) {
                assignedInThisMeeting.add(a.publisher_id);
            }
        }
        // Histórico de designações mecânicas
        const historyAssignments = await mechanicalAssignmentRepository_1.mechanicalAssignmentRepository
            .createQueryBuilder("assign")
            .innerJoinAndSelect("assign.schedule", "sched")
            .where("sched.congregation_id = :congregationId", { congregationId })
            .andWhere("sched.date < :meetingDate", { meetingDate })
            .andWhere("assign.publisher_id IS NOT NULL")
            .orderBy("sched.date", "DESC")
            .getMany();
        const lastAnyDateMap = new Map();
        const lastAnyRoleMap = new Map();
        const lastThisRoleDateMap = new Map();
        for (const ha of historyAssignments) {
            if (!ha.publisher_id)
                continue;
            const dt = ha.schedule.date;
            if (!lastAnyDateMap.has(ha.publisher_id)) {
                lastAnyDateMap.set(ha.publisher_id, dt);
                lastAnyRoleMap.set(ha.publisher_id, ha.role);
            }
            if (ha.role === role && !lastThisRoleDateMap.has(ha.publisher_id)) {
                lastThisRoleDateMap.set(ha.publisher_id, dt);
            }
        }
        const suggestions = [];
        for (const pub of publishers) {
            const isQualified = this.isPublisherQualifiedForRole(pub, role);
            // Indisponibilidade
            let isUnavailable = false;
            let unavailabilityReason = null;
            if ((_a = pub.unavailabilities) === null || _a === void 0 ? void 0 : _a.length) {
                for (const unav of pub.unavailabilities) {
                    const start = (0, dayjs_1.default)(unav.startDate);
                    const end = (0, dayjs_1.default)(unav.endDate);
                    if ((targetDateObj.isAfter(start, "day") || targetDateObj.isSame(start, "day")) &&
                        (targetDateObj.isBefore(end, "day") || targetDateObj.isSame(end, "day"))) {
                        isUnavailable = true;
                        unavailabilityReason = unav.reason || "Ausente / Indisponível";
                        break;
                    }
                }
            }
            const isMidweekChairman = Boolean(midweekChairmanId && pub.id === midweekChairmanId);
            const isAssignedThisMeeting = assignedInThisMeeting.has(pub.id);
            const lastAny = lastAnyDateMap.get(pub.id) || null;
            const daysSinceLastAny = lastAny ? targetDateObj.diff((0, dayjs_1.default)(lastAny), "day") : null;
            const lastThis = lastThisRoleDateMap.get(pub.id) || null;
            const daysSinceLastThisRole = lastThis ? targetDateObj.diff((0, dayjs_1.default)(lastThis), "day") : null;
            const lastRole = lastAnyRoleMap.get(pub.id) || null;
            // Cálculo da pontuação inteligente de recomendação
            let score = 1000;
            if (isUnavailable)
                score -= 50000;
            if (isMidweekChairman)
                score -= 40000; // Alerta forte, presidente não deve ser colocado
            if (isAssignedThisMeeting)
                score -= 30000;
            if (!isQualified)
                score -= 15000;
            // LRU (mais antigo primeiro)
            if (daysSinceLastAny === null) {
                score += 10000; // Nunca fez
            }
            else {
                score += daysSinceLastAny * 15;
            }
            // Mesclagem (alternância de papéis)
            if (lastRole === role) {
                score -= 4000; // Fez essa mesma função da última vez
            }
            else if (lastRole !== null) {
                score += 2000; // Bônus de diversificação
            }
            if (daysSinceLastThisRole === null) {
                score += 1500;
            }
            else {
                score += daysSinceLastThisRole * 5;
            }
            suggestions.push({
                id: pub.id,
                fullName: pub.fullName,
                nickname: pub.nickname,
                isQualified,
                isUnavailable,
                unavailabilityReason,
                isMidweekChairman,
                isAssignedThisMeeting,
                daysSinceLastAny,
                daysSinceLastThisRole,
                lastRole,
                score
            });
        }
        // Ordena: maior pontuação primeiro
        return suggestions.sort((a, b) => b.score - a.score);
    }
    isPublisherQualifiedForRole(pub, role) {
        var _a, _b;
        const names = [];
        if ((_a = pub.privilegesRelation) === null || _a === void 0 ? void 0 : _a.length) {
            for (const pp of pub.privilegesRelation) {
                if ((_b = pp.privilege) === null || _b === void 0 ? void 0 : _b.name) {
                    const isEnded = pp.endDate ? (0, dayjs_1.default)(pp.endDate).isBefore((0, dayjs_1.default)(), "day") : false;
                    if (!isEnded) {
                        names.push(pp.privilege.name);
                    }
                }
            }
        }
        if (pub.privileges && Array.isArray(pub.privileges)) {
            names.push(...pub.privileges);
        }
        const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const has = (...targets) => {
            return names.some(p => {
                const normP = norm(p);
                return targets.some(t => {
                    const normT = norm(t);
                    return normP === normT || normP.includes(normT);
                });
            });
        };
        const isElder = has("Ancião", "Anciao", "Elder");
        const isMS = has("Servo Ministerial", "Ministerial Servant");
        const isElderOrMS = isElder || isMS;
        switch (role) {
            case mechanical_1.MechanicalRole.ATTENDANT:
                return has("Indicador", "Attendant") || isElderOrMS;
            case mechanical_1.MechanicalRole.SOUND:
                return has("Som", "Sound", "Som e Mídias", "Sound and Media");
            case mechanical_1.MechanicalRole.MEDIA:
                return has("Mídias", "Midias", "Media", "Som e Mídias", "Sound and Media");
            case mechanical_1.MechanicalRole.SOUND_AND_MEDIA:
                return has("Som e Mídias", "Sound and Media") || (has("Som", "Sound") && has("Mídias", "Media"));
            case mechanical_1.MechanicalRole.ROVING_MIC:
                return has("Microfone Volante", "Microphone Attendant", "Volante");
            case mechanical_1.MechanicalRole.STAGE_MIC:
                return has("Pedestal", "Stage Attendant", "Microfone Volante", "Microphone Attendant");
            default:
                return true;
        }
    }
    async getQualifications(congregationId) {
        const publishers = await publisherRepository_1.publisherRepository.find({
            where: {
                congregation: { id: congregationId },
                situation: Publisher_1.Situation.Ativo,
                gender: Publisher_1.Gender.Masculino
            },
            relations: ["privilegesRelation", "privilegesRelation.privilege"],
            order: { fullName: "ASC" }
        });
        return publishers.map(pub => ({
            id: pub.id,
            fullName: pub.fullName,
            nickname: pub.nickname,
            canAttendant: this.isPublisherQualifiedForRole(pub, mechanical_1.MechanicalRole.ATTENDANT),
            canSound: this.isPublisherQualifiedForRole(pub, mechanical_1.MechanicalRole.SOUND),
            canMedia: this.isPublisherQualifiedForRole(pub, mechanical_1.MechanicalRole.MEDIA),
            canSoundAndMedia: this.isPublisherQualifiedForRole(pub, mechanical_1.MechanicalRole.SOUND_AND_MEDIA),
            canRovingMic: this.isPublisherQualifiedForRole(pub, mechanical_1.MechanicalRole.ROVING_MIC),
            canStageMic: this.isPublisherQualifiedForRole(pub, mechanical_1.MechanicalRole.STAGE_MIC)
        }));
    }
    async toggleQualification(publisherId, role, enabled) {
        const publisher = await publisherRepository_1.publisherRepository.findOne({
            where: { id: publisherId },
            relations: ["privilegesRelation", "privilegesRelation.privilege"]
        });
        if (!publisher) {
            throw new api_errors_1.NotFoundError("Publicador não encontrado.");
        }
        const rolePrivilegeMap = {
            [mechanical_1.MechanicalRole.ATTENDANT]: { pt: "Indicador", en: "Attendant" },
            [mechanical_1.MechanicalRole.SOUND]: { pt: "Som", en: "Sound" },
            [mechanical_1.MechanicalRole.MEDIA]: { pt: "Mídias", en: "Media" },
            [mechanical_1.MechanicalRole.SOUND_AND_MEDIA]: { pt: "Som e Mídias", en: "Sound and Media" },
            [mechanical_1.MechanicalRole.ROVING_MIC]: { pt: "Microfone Volante", en: "Microphone Attendant" },
            [mechanical_1.MechanicalRole.STAGE_MIC]: { pt: "Pedestal", en: "Stage Attendant" }
        };
        const target = rolePrivilegeMap[role];
        if (!target) {
            throw new api_errors_1.BadRequestError("Função inválida.");
        }
        let privilegesList = publisher.privileges ? [...publisher.privileges] : [];
        if (enabled) {
            if (!privilegesList.includes(target.pt)) {
                privilegesList.push(target.pt);
            }
        }
        else {
            privilegesList = privilegesList.filter(p => p !== target.pt);
        }
        publisher.privileges = privilegesList;
        await publisherRepository_1.publisherRepository.save(publisher);
        // Sincroniza tabela publisher_privileges
        const privilegeEntity = await privilegeRepository_1.privilegeRepository.findOneBy({ name: target.en });
        if (privilegeEntity) {
            if (enabled) {
                const existing = await publisherPrivilegeRepository_1.publisherPrivilegeRepository.findOne({
                    where: {
                        publisher: { id: publisher.id },
                        privilege: { id: privilegeEntity.id }
                    }
                });
                if (!existing) {
                    await publisherPrivilegeRepository_1.publisherPrivilegeRepository.save({
                        publisher,
                        privilege: privilegeEntity,
                        startDate: null,
                        endDate: null
                    });
                }
            }
            else {
                await publisherPrivilegeRepository_1.publisherPrivilegeRepository.delete({
                    publisher: { id: publisher.id },
                    privilege: { id: privilegeEntity.id }
                });
            }
        }
        return { success: true };
    }
}
exports.MechanicalScheduleService = MechanicalScheduleService;
