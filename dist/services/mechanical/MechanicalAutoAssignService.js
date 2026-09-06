"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MechanicalAutoAssignService = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const isBetween_1 = __importDefault(require("dayjs/plugin/isBetween"));
const isoWeek_1 = __importDefault(require("dayjs/plugin/isoWeek"));
const Publisher_1 = require("../../entities/Publisher");
const cleaningFunctions_1 = require("../../functions/cleaningFunctions");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const mechanicalAssignmentRepository_1 = require("../../repositories/mechanicalAssignmentRepository");
const mechanicalScheduleRepository_1 = require("../../repositories/mechanicalScheduleRepository");
const midweekScheduleRepository_1 = require("../../repositories/midweekScheduleRepository");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const mechanical_1 = require("../../types/mechanical");
const MechanicalScheduleService_1 = require("./MechanicalScheduleService");
dayjs_1.default.extend(isoWeek_1.default);
dayjs_1.default.extend(isBetween_1.default);
class MechanicalAutoAssignService {
    constructor() {
        this.scheduleService = new MechanicalScheduleService_1.MechanicalScheduleService();
    }
    async autoAssignMonth(congregationId, year, month, options = { forceReassignManual: false }) {
        const congregation = await congregationRepository_1.congregationRepository.findOne({
            where: { id: congregationId }
        });
        if (!congregation) {
            throw new Error("Congregação não encontrada.");
        }
        const config = await this.scheduleService.getConfig(congregationId);
        // Dias da semana das reuniões da congregação
        const midweekDay = congregation.dayMeetingLifeAndMinistary
            ? (0, cleaningFunctions_1.convertMeetingDayPortugueseToIso)(congregation.dayMeetingLifeAndMinistary)
            : 3; // Quarta-feira por padrão
        const endweekDay = congregation.dayMeetingPublic
            ? (0, cleaningFunctions_1.convertMeetingDayPortugueseToIso)(congregation.dayMeetingPublic)
            : 7; // Domingo por padrão
        // Intervalo do mês em semanas (Segunda a Domingo)
        const startOfMonth = (0, dayjs_1.default)(`${year}-${String(month).padStart(2, "0")}-01`);
        const endOfMonth = startOfMonth.endOf("month");
        const firstMonday = startOfMonth.startOf("isoWeek");
        const lastSunday = endOfMonth.endOf("isoWeek");
        // Publicadores ativos varões da congregação com privilégios e ausências
        const publishers = await publisherRepository_1.publisherRepository.find({
            where: {
                congregation: { id: congregationId },
                situation: Publisher_1.Situation.Ativo,
                gender: Publisher_1.Gender.Masculino
            },
            relations: ["privilegesRelation", "privilegesRelation.privilege", "unavailabilities"]
        });
        // 1. Carrega histórico prévio para inicializar o algoritmo LRU & Mesclagem
        const previousAssignments = await mechanicalAssignmentRepository_1.mechanicalAssignmentRepository
            .createQueryBuilder("assign")
            .innerJoinAndSelect("assign.schedule", "sched")
            .where("sched.congregation_id = :congregationId", { congregationId })
            .andWhere("sched.date < :startDate", { startDate: firstMonday.format("YYYY-MM-DD") })
            .andWhere("assign.publisher_id IS NOT NULL")
            .orderBy("sched.date", "DESC")
            .getMany();
        const lastAnyDateMap = new Map();
        const lastAnyRoleMap = new Map();
        const lastThisRoleDateMap = new Map();
        for (const pa of previousAssignments) {
            if (!pa.publisher_id)
                continue;
            const dt = pa.schedule.date;
            if (!lastAnyDateMap.has(pa.publisher_id)) {
                lastAnyDateMap.set(pa.publisher_id, dt);
                lastAnyRoleMap.set(pa.publisher_id, pa.role);
            }
            const key = `${pa.publisher_id}:${pa.role}`;
            if (!lastThisRoleDateMap.has(key)) {
                lastThisRoleDateMap.set(key, dt);
            }
        }
        const resultSchedules = [];
        let currentWeekMonday = firstMonday.clone();
        while (currentWeekMonday.isBefore(lastSunday)) {
            const weekStartDate = currentWeekMonday.format("YYYY-MM-DD");
            // Datas exatas das duas reuniões dessa semana
            const midweekMeetingDate = currentWeekMonday.isoWeekday(midweekDay).format("YYYY-MM-DD");
            const weekendMeetingDate = currentWeekMonday.isoWeekday(endweekDay).format("YYYY-MM-DD");
            // ⚠️ REGRA DO PRESIDENTE DO MEIO DE SEMANA:
            // Busca o presidente do meio de semana para esta semana
            const midweekSchedule = await midweekScheduleRepository_1.midweekScheduleRepository.findOne({
                where: {
                    congregation_id: congregationId,
                    weekDate: weekStartDate
                }
            });
            const midweekChairmanId = (midweekSchedule === null || midweekSchedule === void 0 ? void 0 : midweekSchedule.chairman_id) || null;
            // Reuniões a planejar na semana
            const meetingsToPlan = [
                {
                    date: midweekMeetingDate,
                    meetingType: mechanical_1.MechanicalMeetingType.MIDWEEK,
                    attendantsCount: config.midweekAttendantsCount,
                    soundCount: config.midweekSoundCount,
                    mediaCount: config.midweekMediaCount,
                    rovingMicsCount: config.midweekRovingMicsCount,
                    stageMicsCount: config.midweekStageMicsCount
                },
                {
                    date: weekendMeetingDate,
                    meetingType: mechanical_1.MechanicalMeetingType.WEEKEND,
                    attendantsCount: config.weekendAttendantsCount,
                    soundCount: config.weekendSoundCount,
                    mediaCount: config.weekendMediaCount,
                    rovingMicsCount: config.weekendRovingMicsCount,
                    stageMicsCount: config.weekendStageMicsCount
                }
            ];
            let midweekPlannedAssignments = [];
            for (const meetingInfo of meetingsToPlan) {
                let schedule = await mechanicalScheduleRepository_1.mechanicalScheduleRepository.findOne({
                    where: {
                        congregation_id: congregationId,
                        date: meetingInfo.date
                    },
                    relations: ["assignments", "assignments.publisher"]
                });
                if (!schedule) {
                    schedule = mechanicalScheduleRepository_1.mechanicalScheduleRepository.create({
                        congregation_id: congregationId,
                        weekStartDate,
                        date: meetingInfo.date,
                        meetingType: meetingInfo.meetingType,
                        assignments: []
                    });
                    schedule = await mechanicalScheduleRepository_1.mechanicalScheduleRepository.save(schedule);
                }
                // Cria lista de slots esperados para esta reunião
                const expectedSlots = [];
                // Indicadores
                for (let i = 1; i <= meetingInfo.attendantsCount; i++) {
                    expectedSlots.push({ role: mechanical_1.MechanicalRole.ATTENDANT, order: i });
                }
                // Som e Mídias (combinados ou separados)
                if (config.combineSoundAndMedia) {
                    expectedSlots.push({ role: mechanical_1.MechanicalRole.SOUND_AND_MEDIA, order: 1 });
                }
                else {
                    for (let i = 1; i <= meetingInfo.soundCount; i++) {
                        expectedSlots.push({ role: mechanical_1.MechanicalRole.SOUND, order: i });
                    }
                    for (let i = 1; i <= meetingInfo.mediaCount; i++) {
                        expectedSlots.push({ role: mechanical_1.MechanicalRole.MEDIA, order: i });
                    }
                }
                // Volantes
                for (let i = 1; i <= meetingInfo.rovingMicsCount; i++) {
                    expectedSlots.push({ role: mechanical_1.MechanicalRole.ROVING_MIC, order: i });
                }
                // Pedestal
                for (let i = 1; i <= meetingInfo.stageMicsCount; i++) {
                    expectedSlots.push({ role: mechanical_1.MechanicalRole.STAGE_MIC, order: i });
                }
                const assignedThisMeeting = new Set();
                // Carrega ou inicializa os assignments
                const currentAssignments = schedule.assignments || [];
                const updatedAssignments = [];
                // 1. Preserva designações manuais se forceReassignManual for false (apenas se NÃO for fim de semana com equipe única)
                for (const slot of expectedSlots) {
                    const existing = currentAssignments.find((a) => a.role === slot.role && a.order === slot.order);
                    if (existing && existing.publisher_id && (!options.forceReassignManual && existing.isManual)) {
                        // Se a congregação usa o mesmo grupo a semana toda e estamos no fim de semana,
                        // NUNCA preserva designações antigas do fim de semana para espelhar estritamente a equipe da semana
                        if (config.sameTeamWholeWeek && meetingInfo.meetingType === mechanical_1.MechanicalMeetingType.WEEKEND) {
                            continue;
                        }
                        assignedThisMeeting.add(existing.publisher_id);
                        updatedAssignments.push(existing);
                        // Atualiza histórico em memória
                        lastAnyDateMap.set(existing.publisher_id, meetingInfo.date);
                        lastAnyRoleMap.set(existing.publisher_id, existing.role);
                        lastThisRoleDateMap.set(`${existing.publisher_id}:${existing.role}`, meetingInfo.date);
                    }
                }
                // 2. Se for fim de semana e a congregação usa a mesma equipe a semana toda:
                // Copia DIRETAMENTE e INTEGRALMENTE a equipe definida para o meio de semana
                if (config.sameTeamWholeWeek && meetingInfo.meetingType === mechanical_1.MechanicalMeetingType.WEEKEND) {
                    for (const slot of expectedSlots) {
                        const matchingMidweek = midweekPlannedAssignments.find(ma => ma.role === slot.role && ma.order === slot.order);
                        const targetPublisherId = matchingMidweek ? matchingMidweek.publisher_id : null;
                        const targetIsManual = matchingMidweek ? matchingMidweek.isManual : false;
                        let chosenAssignment = currentAssignments.find((a) => a.role === slot.role && a.order === slot.order);
                        const matchingPublisher = targetPublisherId ? (publishers.find(p => p.id === targetPublisherId) || null) : null;
                        if (!chosenAssignment) {
                            chosenAssignment = mechanicalAssignmentRepository_1.mechanicalAssignmentRepository.create({
                                schedule_id: schedule.id,
                                role: slot.role,
                                order: slot.order,
                                publisher_id: targetPublisherId,
                                publisher: matchingPublisher,
                                isManual: targetIsManual
                            });
                        }
                        else {
                            chosenAssignment.publisher_id = targetPublisherId;
                            chosenAssignment.publisher = matchingPublisher;
                            chosenAssignment.isManual = targetIsManual;
                        }
                        await mechanicalAssignmentRepository_1.mechanicalAssignmentRepository.save(chosenAssignment);
                        if (targetPublisherId) {
                            assignedThisMeeting.add(targetPublisherId);
                            lastAnyDateMap.set(targetPublisherId, meetingInfo.date);
                            lastAnyRoleMap.set(targetPublisherId, slot.role);
                            lastThisRoleDateMap.set(`${targetPublisherId}:${slot.role}`, meetingInfo.date);
                        }
                        updatedAssignments.push(chosenAssignment);
                    }
                }
                else {
                    // 3. Preenche os slots restantes com o Algoritmo Inteligente (LRU + Diversificação)
                    const meetingDateObj = (0, dayjs_1.default)(meetingInfo.date);
                    for (const slot of expectedSlots) {
                        const alreadyAssigned = updatedAssignments.some(a => a.role === slot.role && a.order === slot.order);
                        if (alreadyAssigned)
                            continue;
                        // Busca candidatos elegíveis
                        const eligiblePublishers = publishers.filter(pub => {
                            var _a;
                            // ❌ RESTRIÇÃO ESTRITA: Presidente do Meio de Semana NUNCA é colocado no auto-preenchimento
                            if (midweekChairmanId && pub.id === midweekChairmanId) {
                                return false;
                            }
                            // ❌ Não pode 2 funções na mesma reunião
                            if (assignedThisMeeting.has(pub.id)) {
                                return false;
                            }
                            // ❌ Indisponibilidade / Ausência
                            if ((_a = pub.unavailabilities) === null || _a === void 0 ? void 0 : _a.length) {
                                const isUnavailable = pub.unavailabilities.some(unav => {
                                    const start = (0, dayjs_1.default)(unav.startDate);
                                    const end = (0, dayjs_1.default)(unav.endDate);
                                    return ((meetingDateObj.isAfter(start, "day") || meetingDateObj.isSame(start, "day")) &&
                                        (meetingDateObj.isBefore(end, "day") || meetingDateObj.isSame(end, "day")));
                                });
                                if (isUnavailable)
                                    return false;
                            }
                            return true;
                        });
                        // Filtra por qualificação com fallback se ninguém tiver o privilégio explícito
                        let qualifiedPublishers = eligiblePublishers.filter(pub => this.scheduleService.isPublisherQualifiedForRole(pub, slot.role));
                        if (qualifiedPublishers.length === 0) {
                            qualifiedPublishers = eligiblePublishers;
                        }
                        // Pontua e ordena os candidatos (LRU + Mesclagem de Funções)
                        const scoredCandidates = qualifiedPublishers.map(pub => {
                            const lastAnyDate = lastAnyDateMap.get(pub.id) || null;
                            const daysSinceLastAny = lastAnyDate
                                ? meetingDateObj.diff((0, dayjs_1.default)(lastAnyDate), "day")
                                : null;
                            const lastRole = lastAnyRoleMap.get(pub.id) || null;
                            const roleKey = `${pub.id}:${slot.role}`;
                            const lastThisRoleDate = lastThisRoleDateMap.get(roleKey) || null;
                            const daysSinceLastThisRole = lastThisRoleDate
                                ? meetingDateObj.diff((0, dayjs_1.default)(lastThisRoleDate), "day")
                                : null;
                            let score = 1000;
                            // 🎯 CRITÉRIO 1: Mais antigos primeiro (LRU - tempo sem designação mecânica)
                            if (daysSinceLastAny === null) {
                                score += 10000; // Prioridade máxima para quem nunca fez
                            }
                            else {
                                score += daysSinceLastAny * 30;
                            }
                            // 🎯 CRITÉRIO 2: Mesclando, para o mesmo irmão não fazer a mesma coisa sempre
                            if (lastRole === slot.role) {
                                // Penalidade severa se a última função dele foi a mesma
                                score -= 6000;
                            }
                            else if (lastRole !== null) {
                                // Bônus de rotação/diversificação de papéis
                                score += 3000;
                            }
                            // Preferência por quem está há mais tempo sem fazer esta função específica
                            if (daysSinceLastThisRole === null) {
                                score += 1500;
                            }
                            else {
                                score += daysSinceLastThisRole * 10;
                            }
                            return { pub, score };
                        });
                        scoredCandidates.sort((a, b) => b.score - a.score);
                        let chosenAssignment = currentAssignments.find((a) => a.role === slot.role && a.order === slot.order);
                        if (!chosenAssignment) {
                            chosenAssignment = mechanicalAssignmentRepository_1.mechanicalAssignmentRepository.create({
                                schedule_id: schedule.id,
                                role: slot.role,
                                order: slot.order,
                                publisher_id: null,
                                isManual: false
                            });
                        }
                        if (scoredCandidates.length > 0) {
                            const chosen = scoredCandidates[0].pub;
                            chosenAssignment.publisher_id = chosen.id;
                            chosenAssignment.publisher = chosen;
                            chosenAssignment.isManual = false;
                            assignedThisMeeting.add(chosen.id);
                            // Atualiza estado em memória
                            lastAnyDateMap.set(chosen.id, meetingInfo.date);
                            lastAnyRoleMap.set(chosen.id, slot.role);
                            lastThisRoleDateMap.set(`${chosen.id}:${slot.role}`, meetingInfo.date);
                        }
                        else {
                            chosenAssignment.publisher_id = null;
                            chosenAssignment.publisher = null;
                        }
                        await mechanicalAssignmentRepository_1.mechanicalAssignmentRepository.save(chosenAssignment);
                        updatedAssignments.push(chosenAssignment);
                    }
                }
                if (meetingInfo.meetingType === mechanical_1.MechanicalMeetingType.MIDWEEK) {
                    midweekPlannedAssignments = [...updatedAssignments];
                }
                // Remove slots antigos não mais necessários (ex: se reduziu quantidade)
                for (const oldAssign of currentAssignments) {
                    const isStillNeeded = expectedSlots.some(s => s.role === oldAssign.role && s.order === oldAssign.order);
                    if (!isStillNeeded) {
                        await mechanicalAssignmentRepository_1.mechanicalAssignmentRepository.delete(oldAssign.id);
                    }
                }
                const savedSchedule = await mechanicalScheduleRepository_1.mechanicalScheduleRepository
                    .createQueryBuilder("sched")
                    .leftJoinAndSelect("sched.assignments", "assignments")
                    .leftJoinAndSelect("assignments.publisher", "publisher")
                    .where("sched.id = :id", { id: schedule.id })
                    .orderBy("assignments.order", "ASC")
                    .getOne();
                if (savedSchedule) {
                    resultSchedules.push(savedSchedule);
                }
            }
            currentWeekMonday = currentWeekMonday.add(1, "week");
        }
        return resultSchedules;
    }
}
exports.MechanicalAutoAssignService = MechanicalAutoAssignService;
