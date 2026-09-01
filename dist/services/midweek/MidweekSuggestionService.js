"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MidweekSuggestionService = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const MidweekWorkbookPart_1 = require("../../entities/MidweekWorkbookPart");
const Publisher_1 = require("../../entities/Publisher");
const midweekMeetingPartRepository_1 = require("../../repositories/midweekMeetingPartRepository");
const midweekScheduleRepository_1 = require("../../repositories/midweekScheduleRepository");
const publisherRepository_1 = require("../../repositories/publisherRepository");
class MidweekSuggestionService {
    async getSuggestionsForPart(partId, congregationId, isForAssistant = false) {
        var _a;
        const part = await midweekMeetingPartRepository_1.midweekMeetingPartRepository.findOne({
            where: { id: partId },
            relations: ["schedule", "assignedPublisher", "assignedPublisher.family"]
        });
        if (!part || part.schedule.congregation_id !== congregationId) {
            throw new Error("Parte não encontrada.");
        }
        let targetPublisherGender = null;
        let targetPublisherFamilyId = null;
        if (isForAssistant && part.assigned_publisher_id) {
            const student = await publisherRepository_1.publisherRepository.findOne({
                where: { id: part.assigned_publisher_id },
                relations: ["family"]
            });
            if (student) {
                targetPublisherGender = student.gender;
                targetPublisherFamilyId = ((_a = student.family) === null || _a === void 0 ? void 0 : _a.id) || null;
            }
        }
        const meetingDate = part.schedule.meetingDate || part.schedule.weekDate;
        return await this.calculateSuggestions({
            congregationId,
            meetingDate,
            scheduleId: part.schedule_id,
            partType: part.partType,
            section: part.section,
            isForAssistant,
            targetPublisherGender,
            targetPublisherFamilyId,
            currentAssignedPublisherId: part.assigned_publisher_id
        });
    }
    async getSuggestionsForRole(role, scheduleId, congregationId) {
        const schedule = await midweekScheduleRepository_1.midweekScheduleRepository.findOne({
            where: { id: scheduleId, congregation_id: congregationId }
        });
        if (!schedule) {
            throw new Error("Programação não encontrada.");
        }
        const meetingDate = schedule.meetingDate || schedule.weekDate;
        return await this.calculateSuggestions({
            congregationId,
            meetingDate,
            scheduleId: schedule.id,
            role,
            isForAssistant: false
        });
    }
    async calculateSuggestions(params) {
        var _a, _b;
        const { congregationId, meetingDate, scheduleId, partType, role, isForAssistant, targetPublisherGender, targetPublisherFamilyId, currentAssignedPublisherId } = params;
        const publishers = await publisherRepository_1.publisherRepository.find({
            where: {
                congregation: { id: congregationId },
                situation: Publisher_1.Situation.Ativo
            },
            relations: [
                "midweekQualification",
                "unavailabilities",
                "family",
                "privilegesRelation",
                "privilegesRelation.privilege"
            ]
        });
        const currentSchedule = await midweekScheduleRepository_1.midweekScheduleRepository.findOne({
            where: { id: scheduleId },
            relations: ["parts", "parts.assignedPublisher", "parts.assistantPublisher"]
        });
        const sameWeekAssignments = new Map();
        if (currentSchedule) {
            if (currentSchedule.chairman_id)
                this.addConflict(sameWeekAssignments, currentSchedule.chairman_id, "Presidente");
            if (currentSchedule.opening_prayer_id)
                this.addConflict(sameWeekAssignments, currentSchedule.opening_prayer_id, "Oração Inicial");
            if (currentSchedule.closing_prayer_id)
                this.addConflict(sameWeekAssignments, currentSchedule.closing_prayer_id, "Oração Final");
            if (currentSchedule.aux_counselor_1_id)
                this.addConflict(sameWeekAssignments, currentSchedule.aux_counselor_1_id, "Conselheiro Auxiliar");
            if (currentSchedule.aux_counselor_2_id)
                this.addConflict(sameWeekAssignments, currentSchedule.aux_counselor_2_id, "Conselheiro Auxiliar 2");
            if (currentSchedule.cbs_conductor_id)
                this.addConflict(sameWeekAssignments, currentSchedule.cbs_conductor_id, "Dirigente do Estudo Bíblico");
            if (currentSchedule.cbs_reader_id)
                this.addConflict(sameWeekAssignments, currentSchedule.cbs_reader_id, "Leitor do Estudo Bíblico");
            if (currentSchedule.parts) {
                for (const p of currentSchedule.parts) {
                    if (p.assigned_publisher_id) {
                        this.addConflict(sameWeekAssignments, p.assigned_publisher_id, p.title);
                    }
                    if (p.assistant_publisher_id) {
                        this.addConflict(sameWeekAssignments, p.assistant_publisher_id, `Ajudante em: ${p.title}`);
                    }
                }
            }
        }
        const lastDateThisPartMap = new Map();
        const lastDateAnyPartMap = new Map();
        const pairHistoryMap = new Map();
        // 1. HISTÓRICO DE CARGOS E FUNÇÕES GERAIS (MidweekSchedule)
        const historySchedules = await midweekScheduleRepository_1.midweekScheduleRepository
            .createQueryBuilder("sched")
            .where("sched.congregation_id = :congregationId", { congregationId })
            .andWhere("sched.weekDate < :meetingDate", { meetingDate })
            .orderBy("sched.weekDate", "DESC")
            .getMany();
        for (const hs of historySchedules) {
            const date = hs.meetingDate || hs.weekDate;
            const recordRole = (pubId, targetRole) => {
                if (!pubId)
                    return;
                if (!lastDateAnyPartMap.has(pubId)) {
                    lastDateAnyPartMap.set(pubId, date);
                }
                if (role === targetRole && !lastDateThisPartMap.has(pubId)) {
                    lastDateThisPartMap.set(pubId, date);
                }
            };
            recordRole(hs.chairman_id, "CHAIRMAN");
            recordRole(hs.opening_prayer_id, "OPENING_PRAYER");
            recordRole(hs.closing_prayer_id, "CLOSING_PRAYER");
            recordRole(hs.cbs_conductor_id, "CBS_CONDUCTOR");
            recordRole(hs.cbs_reader_id, "CBS_READER");
            recordRole(hs.aux_counselor_1_id, "AUX_COUNSELOR");
            recordRole(hs.aux_counselor_2_id, "AUX_COUNSELOR");
        }
        // 2. HISTÓRICO DE PARTES (MidweekMeetingPart)
        const historyParts = await midweekMeetingPartRepository_1.midweekMeetingPartRepository
            .createQueryBuilder("part")
            .innerJoinAndSelect("part.schedule", "schedule")
            .where("schedule.congregation_id = :congregationId", { congregationId })
            .andWhere("schedule.weekDate < :meetingDate", { meetingDate })
            .andWhere("(part.assigned_publisher_id IS NOT NULL OR part.assistant_publisher_id IS NOT NULL)")
            .orderBy("schedule.weekDate", "DESC")
            .getMany();
        for (const hp of historyParts) {
            const partDate = hp.schedule.meetingDate || hp.schedule.weekDate;
            if (hp.assigned_publisher_id) {
                const pubId = hp.assigned_publisher_id;
                if (!lastDateAnyPartMap.has(pubId)) {
                    lastDateAnyPartMap.set(pubId, partDate);
                }
                if (partType && hp.partType === partType && !lastDateThisPartMap.has(pubId)) {
                    lastDateThisPartMap.set(pubId, partDate);
                }
            }
            if (hp.assistant_publisher_id) {
                const asstId = hp.assistant_publisher_id;
                if (!lastDateAnyPartMap.has(asstId)) {
                    lastDateAnyPartMap.set(asstId, partDate);
                }
                if (isForAssistant && !lastDateThisPartMap.has(asstId)) {
                    lastDateThisPartMap.set(asstId, partDate);
                }
            }
            if (isForAssistant && currentAssignedPublisherId && hp.assigned_publisher_id && hp.assistant_publisher_id) {
                let partnerId = null;
                if (hp.assigned_publisher_id === currentAssignedPublisherId) {
                    partnerId = hp.assistant_publisher_id;
                }
                else if (hp.assistant_publisher_id === currentAssignedPublisherId) {
                    partnerId = hp.assigned_publisher_id;
                }
                if (partnerId) {
                    const existing = pairHistoryMap.get(partnerId);
                    if (!existing) {
                        pairHistoryMap.set(partnerId, { lastDate: partDate, count: 1 });
                    }
                    else {
                        existing.count += 1;
                    }
                }
            }
        }
        const suggestions = [];
        const targetDateObj = (0, dayjs_1.default)(meetingDate);
        for (const pub of publishers) {
            if (isForAssistant && currentAssignedPublisherId && pub.id === currentAssignedPublisherId) {
                continue;
            }
            const isQualified = this.checkQualification(pub, partType, role, isForAssistant);
            if (!isQualified) {
                continue;
            }
            let isFamilyMatch = false;
            if (isForAssistant && targetPublisherGender) {
                const sameGender = pub.gender === targetPublisherGender;
                const pubFamilyId = ((_a = pub.family) === null || _a === void 0 ? void 0 : _a.id) || pub.family_id || null;
                const sameFamily = Boolean(targetPublisherFamilyId && pubFamilyId && targetPublisherFamilyId === pubFamilyId);
                if (!sameGender && !sameFamily) {
                    continue;
                }
                if (sameFamily) {
                    isFamilyMatch = true;
                }
            }
            let isUnavailable = false;
            let unavailabilityReason = null;
            if (pub.unavailabilities && pub.unavailabilities.length > 0) {
                for (const unav of pub.unavailabilities) {
                    const start = (0, dayjs_1.default)(unav.startDate);
                    const end = (0, dayjs_1.default)(unav.endDate);
                    if ((targetDateObj.isAfter(start, 'day') || targetDateObj.isSame(start, 'day')) &&
                        (targetDateObj.isBefore(end, 'day') || targetDateObj.isSame(end, 'day'))) {
                        isUnavailable = true;
                        unavailabilityReason = unav.reason || "Ausente / Indisponível";
                        break;
                    }
                }
            }
            const conflicts = sameWeekAssignments.get(pub.id) || [];
            const hasConflictSameWeek = conflicts.length > 0;
            const conflictDescription = hasConflictSameWeek ? conflicts.join(", ") : null;
            const lastThisPart = lastDateThisPartMap.get(pub.id) || null;
            const daysThisPart = lastThisPart ? targetDateObj.diff((0, dayjs_1.default)(lastThisPart), 'day') : null;
            const lastAnyPart = lastDateAnyPartMap.get(pub.id) || null;
            const daysAnyPart = lastAnyPart ? targetDateObj.diff((0, dayjs_1.default)(lastAnyPart), 'day') : null;
            const pairInfo = isForAssistant ? pairHistoryMap.get(pub.id) : null;
            const lastPairedDate = pairInfo ? pairInfo.lastDate : null;
            const daysSinceLastPaired = lastPairedDate ? targetDateObj.diff((0, dayjs_1.default)(lastPairedDate), 'day') : null;
            const timesPaired = pairInfo ? pairInfo.count : 0;
            // 🎯 CÁLCULO DA PONTUAÇÃO COM ALGORITMO DE RODÍZIO JUSTO (LRU - Least Recently Used)
            let score = 1000;
            // 1. Penalidade para indisponibilidade ou conflito na mesma semana
            if (isUnavailable)
                score -= 50000;
            if (hasConflictSameWeek)
                score -= 15000;
            // 2. Rodízio da MESMA função/parte
            if (daysThisPart === null) {
                // Irmão nunca fez esta função/parte antes na congregação: PRIORIDADE MÁXIMA
                score += 10000;
            }
            else {
                // Quanto mais tempo se passou, mais pontos ganha linearmente
                score += daysThisPart * 50;
            }
            // 3. Rodízio GERAL de qualquer parte na congregação
            if (daysAnyPart === null) {
                score += 500;
            }
            else {
                score += Math.min(daysAnyPart * 2, 300);
            }
            // 4. Critérios para Ajudante de Estudante
            if (isForAssistant) {
                if (isFamilyMatch) {
                    score += 800; // Prioriza familiares (marido/esposa, pai/filho)
                }
                if (timesPaired === 0) {
                    score += 300; // Diversifica duplas
                }
                else if (daysSinceLastPaired !== null && daysSinceLastPaired < 60) {
                    score -= 500; // Evita repetir a mesma dupla muito recentemente
                }
            }
            suggestions.push({
                id: pub.id,
                fullName: pub.fullName,
                nickname: pub.nickname,
                gender: pub.gender,
                family_id: ((_b = pub.family) === null || _b === void 0 ? void 0 : _b.id) || pub.family_id || null,
                lastAssignedThisPartDate: lastThisPart,
                daysSinceLastThisPart: daysThisPart,
                lastAssignedAnyPartDate: lastAnyPart,
                daysSinceLastAnyPart: daysAnyPart,
                isUnavailable,
                unavailabilityReason,
                hasConflictSameWeek,
                conflictDescription,
                isFamilyMatch,
                lastPairedWithStudentDate: lastPairedDate,
                daysSinceLastPairedWithStudent: daysSinceLastPaired,
                timesPairedWithStudent: timesPaired,
                qualificationScore: score
            });
        }
        // Ordenação das sugestões por histórico real (LRU):
        return suggestions.sort((a, b) => {
            var _a, _b, _c, _d;
            // 1. Indisponíveis vão para o final
            if (a.isUnavailable !== b.isUnavailable) {
                return a.isUnavailable ? 1 : -1;
            }
            // 2. Quem NUNCA fez esta parte específica vem PRIMEIRO no topo
            const aNeverThisPart = a.daysSinceLastThisPart === null;
            const bNeverThisPart = b.daysSinceLastThisPart === null;
            if (aNeverThisPart !== bNeverThisPart) {
                return aNeverThisPart ? -1 : 1;
            }
            // 3. Se ambos nunca fizeram esta parte:
            if (aNeverThisPart && bNeverThisPart) {
                // Desempata por quem está há mais tempo sem fazer QUALQUER parte (null = nunca fez nada)
                const aAny = (_a = a.daysSinceLastAnyPart) !== null && _a !== void 0 ? _a : 999999;
                const bAny = (_b = b.daysSinceLastAnyPart) !== null && _b !== void 0 ? _b : 999999;
                if (bAny !== aAny) {
                    return bAny - aAny;
                }
                return a.fullName.localeCompare(b.fullName);
            }
            // 4. Se ambos já fizeram esta parte: ordenação estrita decrescente de dias (ex: 28 dias > 21 dias > 14 dias > 7 dias)
            const aDays = a.daysSinceLastThisPart;
            const bDays = b.daysSinceLastThisPart;
            if (bDays !== aDays) {
                return bDays - aDays;
            }
            // 5. Desempate por dias da última designação geral (qualquer parte)
            const aAny = (_c = a.daysSinceLastAnyPart) !== null && _c !== void 0 ? _c : 999999;
            const bAny = (_d = b.daysSinceLastAnyPart) !== null && _d !== void 0 ? _d : 999999;
            if (bAny !== aAny) {
                return bAny - aAny;
            }
            // 6. Desempate alfabético
            return a.fullName.localeCompare(b.fullName);
        });
    }
    hasPrivilege(pub, ...targetPrivileges) {
        const names = [];
        // 1. Extrai privilégios da tabela publisher_privileges
        if (pub.privilegesRelation && Array.isArray(pub.privilegesRelation)) {
            for (const pp of pub.privilegesRelation) {
                if (pp.privilege && pp.privilege.name) {
                    const isEnded = pp.endDate ? (0, dayjs_1.default)(pp.endDate).isBefore((0, dayjs_1.default)(), "day") : false;
                    if (!isEnded) {
                        names.push(pp.privilege.name);
                    }
                }
            }
        }
        // 2. Extrai da coluna legada privileges
        if (pub.privileges && Array.isArray(pub.privileges)) {
            names.push(...pub.privileges);
        }
        return names.some(p => {
            const normP = p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            return targetPrivileges.some(tp => {
                const normTp = tp.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                return normP === normTp || normP.includes(normTp);
            });
        });
    }
    checkQualification(pub, partType, role, isForAssistant = false) {
        // 1. PRIORIDADE MÁXIMA: Tabela publisher_midweek_qualifications
        const q = pub.midweekQualification;
        if (isForAssistant) {
            return q ? q.canBeAssistant : true;
        }
        // 2. FALLBACK/PADRÃO: Privilégios de publisher_privileges + privileges + Gênero
        const isElder = this.hasPrivilege(pub, "Ancião", "Anciao", "Presidente", "Elder");
        const isMinisterialServant = this.hasPrivilege(pub, "Servo Ministerial", "Servo ministerial", "Ministerial Servant");
        const isElderOrMS = isElder || isMinisterialServant;
        const isMale = pub.gender === Publisher_1.Gender.Masculino;
        if (role) {
            switch (role) {
                case "CHAIRMAN":
                    return q ? q.canBeChairman : isElder;
                case "OPENING_PRAYER":
                case "CLOSING_PRAYER":
                    return q ? q.canPray : isMale;
                case "AUX_COUNSELOR":
                    return q ? q.canAuxCounselor : isElder;
                case "CBS_CONDUCTOR":
                    return q ? q.canCbsConductor : isElder;
                case "CBS_READER":
                    return q ? q.canCbsReader : isMale;
            }
        }
        if (partType) {
            switch (partType) {
                case MidweekWorkbookPart_1.MidweekPartType.TALK:
                    return q ? q.canTreasuresTalk : isElderOrMS;
                case MidweekWorkbookPart_1.MidweekPartType.GEMS:
                    return q ? q.canSpiritualGems : isElderOrMS;
                case MidweekWorkbookPart_1.MidweekPartType.BIBLE_READING:
                    return q ? q.canBibleReading : isMale;
                case MidweekWorkbookPart_1.MidweekPartType.INITIAL_CALL:
                    return q ? q.canStudentInitialCall : true;
                case MidweekWorkbookPart_1.MidweekPartType.RETURN_VISIT:
                    return q ? q.canStudentReturnVisit : true;
                case MidweekWorkbookPart_1.MidweekPartType.BIBLE_STUDY:
                    return q ? q.canStudentBibleStudy : true;
                case MidweekWorkbookPart_1.MidweekPartType.EXPLAIN_BELIEFS:
                    return q ? q.canStudentExplainBeliefs : true;
                case MidweekWorkbookPart_1.MidweekPartType.STUDENT_TALK:
                    return q ? q.canStudentTalk : isMale;
                case MidweekWorkbookPart_1.MidweekPartType.LOCAL_NEEDS:
                    return q ? q.canLocalNeeds : isElder;
                case MidweekWorkbookPart_1.MidweekPartType.LIVING_ITEM:
                case MidweekWorkbookPart_1.MidweekPartType.WHAT_WOULD_YOU_SAY:
                    return q ? q.canLivingParts : isElderOrMS;
                case MidweekWorkbookPart_1.MidweekPartType.CBS:
                    return q ? q.canCbsConductor : isElder;
                default:
                    return true;
            }
        }
        return true;
    }
    addConflict(map, pubId, description) {
        const existing = map.get(pubId) || [];
        existing.push(description);
        map.set(pubId, existing);
    }
}
exports.MidweekSuggestionService = MidweekSuggestionService;
