"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePublicWitnessSchedules = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const isSameOrAfter_1 = __importDefault(require("dayjs/plugin/isSameOrAfter"));
const isSameOrBefore_1 = __importDefault(require("dayjs/plugin/isSameOrBefore"));
const typeorm_1 = require("typeorm");
const fieldServiceExceptionRepository_1 = require("../../repositories/fieldServiceExceptionRepository");
const fieldServiceScheduleRepository_1 = require("../../repositories/fieldServiceScheduleRepository");
const publicWitnessArrangementRepository_1 = require("../../repositories/publicWitnessArrangementRepository");
const publicWitnessAssignmentPublisherRepository_1 = require("../../repositories/publicWitnessAssignmentPublisherRepository");
const publicWitnessAssignmentRepository_1 = require("../../repositories/publicWitnessAssignmentRepository");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const publisherUnavailabilityRepository_1 = require("../../repositories/publisherUnavailabilityRepository");
const api_errors_1 = require("../../helpers/api-errors");
const Publisher_1 = require("../../entities/Publisher");
dayjs_1.default.extend(isSameOrAfter_1.default);
dayjs_1.default.extend(isSameOrBefore_1.default);
async function generatePublicWitnessSchedules({ arrangement_id, startDate, endDate, mode = "reconcile", publishersPerSlot = 2 }) {
    var _a, _b, _c, _d, _e, _f;
    /* =========================================================
     * 1. Buscar arranjo com horários, preferências e publishers
     * ========================================================= */
    const arrangement = await publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.findOne({
        where: { id: arrangement_id },
        relations: [
            "timeSlots",
            "timeSlots.preferences",
            "timeSlots.preferences.publisher",
            "timeSlots.defaultPublishers",
            "timeSlots.defaultPublishers.publisher"
        ]
    });
    if (!arrangement) {
        throw new api_errors_1.NotFoundError("Arranjo de testemunho público não encontrado");
    }
    const congregation_id = arrangement.congregation_id;
    /* =========================================================
     * 2. Determinar datas válidas no período
     * ========================================================= */
    const start = (0, dayjs_1.default)(startDate);
    const end = (0, dayjs_1.default)(endDate);
    if (!start.isValid() || !end.isValid()) {
        throw new api_errors_1.BadRequestError("Formato de data inválido. Utilize YYYY-MM-DD");
    }
    if (end.isBefore(start)) {
        throw new api_errors_1.BadRequestError("A data final deve ser igual ou posterior à data inicial");
    }
    const candidateDates = [];
    if (arrangement.is_fixed) {
        if (arrangement.weekday === null || arrangement.weekday === undefined) {
            throw new api_errors_1.BadRequestError("Arranjo fixo deve ter um dia da semana definido");
        }
        let cur = start.clone();
        while (cur.isSameOrBefore(end)) {
            if (cur.day() === arrangement.weekday) {
                candidateDates.push(cur.format("YYYY-MM-DD"));
            }
            cur = cur.add(1, "day");
        }
    }
    else {
        if (arrangement.date) {
            const arrDate = (0, dayjs_1.default)(arrangement.date);
            if (arrDate.isSameOrAfter(start) && arrDate.isSameOrBefore(end)) {
                candidateDates.push(arrDate.format("YYYY-MM-DD"));
            }
        }
    }
    if (candidateDates.length === 0) {
        return {
            message: "Nenhuma data compatível com o arranjo no período informado",
            totalAssignments: 0,
            datesProcessed: 0
        };
    }
    /* =========================================================
     * 3. Buscar exceções do período (dias sem atividade)
     * ========================================================= */
    const exceptions = await fieldServiceExceptionRepository_1.fieldServiceExceptionRepository.find({
        where: {
            congregation_id,
            date: (0, typeorm_1.Between)(startDate, endDate)
        }
    });
    const exceptionDates = new Set(exceptions.map(e => e.date));
    const validDates = candidateDates.filter(d => !exceptionDates.has(d));
    if (validDates.length === 0) {
        return {
            message: "Todas as datas do período coincidem com exceções cadastradas",
            totalAssignments: 0,
            datesProcessed: 0
        };
    }
    /* =========================================================
     * 4. Buscar publicadores ativos com privilégio de Testemunho Público
     * ========================================================= */
    const publishers = await publisherRepository_1.publisherRepository.find({
        where: {
            congregation: { id: congregation_id },
            situation: Publisher_1.Situation.Ativo
        },
        relations: ["privilegesRelation", "privilegesRelation.privilege"]
    });
    const eligiblePublishers = publishers.filter(p => { var _a; return (_a = p.privilegesRelation) === null || _a === void 0 ? void 0 : _a.some(pr => { var _a; return ((_a = pr.privilege) === null || _a === void 0 ? void 0 : _a.name) === "Public Witness"; }); });
    if (eligiblePublishers.length === 0) {
        throw new api_errors_1.BadRequestError("Nenhum publicador ativo com o privilégio de 'Testemunho Público' foi encontrado nesta congregação.");
    }
    /* =========================================================
     * 5. Buscar indisponibilidades dos publicadores no período
     * ========================================================= */
    const unavailabilities = await publisherUnavailabilityRepository_1.publisherUnavailabilityRepository.find({
        where: {
            publisher: { congregation: { id: congregation_id } }
        }
    });
    const isPublisherUnavailable = (pubId, dateStr) => {
        return unavailabilities.some(u => {
            if (u.publisher_id !== pubId)
                return false;
            return dateStr >= u.startDate && dateStr <= u.endDate;
        });
    };
    /* =========================================================
     * 6. Buscar dirigentes de campo do período (evitar conflito)
     * ========================================================= */
    const fieldSchedules = await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.find({
        where: {
            template: { congregation_id },
            date: (0, typeorm_1.Between)(startDate, endDate)
        }
    });
    const fieldLeadersByDate = new Map();
    for (const fs of fieldSchedules) {
        if (!fieldLeadersByDate.has(fs.date)) {
            fieldLeadersByDate.set(fs.date, new Set());
        }
        if (fs.leader_id) {
            fieldLeadersByDate.get(fs.date).add(fs.leader_id);
        }
    }
    /* =========================================================
     * 7. Mapeamento de preferências de horários
     *    REGRA: Se um publicador possui preferência cadastrada
     *    para algum(ns) horário(s), ele NUNCA pode ser colocado em outro.
     * ========================================================= */
    const publisherSlotPreferences = new Map(); // publisher_id -> Set<slot_id>
    for (const slot of arrangement.timeSlots) {
        if ((_a = slot.preferences) === null || _a === void 0 ? void 0 : _a.length) {
            for (const pref of slot.preferences) {
                if (!publisherSlotPreferences.has(pref.publisher_id)) {
                    publisherSlotPreferences.set(pref.publisher_id, new Set());
                }
                publisherSlotPreferences.get(pref.publisher_id).add(slot.id);
            }
        }
    }
    const canPublisherTakeSlot = (publisherId, slotId) => {
        const preferences = publisherSlotPreferences.get(publisherId);
        // Se não há preferência registrada para o arranjo, publicador é flexível
        if (!preferences || preferences.size === 0)
            return true;
        // Se há preferência registrada, só pode participar do slot se estiver na preferência
        return preferences.has(slotId);
    };
    /* =========================================================
     * 8. Histórico passado e contadores para rodízio justo
     * ========================================================= */
    const pastAssignments = await publicWitnessAssignmentPublisherRepository_1.publicWitnessAssignmentPublisherRepository.find({
        where: {
            assignment: {
                timeSlot: {
                    arrangement: { congregation_id }
                },
                date: (0, typeorm_1.LessThan)(startDate)
            }
        },
        relations: ["assignment"],
        order: { assignment: { date: "DESC" } }
    });
    const lastAssignedDateMap = new Map();
    for (const pa of pastAssignments) {
        if (((_b = pa.assignment) === null || _b === void 0 ? void 0 : _b.date) && !lastAssignedDateMap.has(pa.publisher_id)) {
            lastAssignedDateMap.set(pa.publisher_id, pa.assignment.date);
        }
    }
    // Contador de designações no período gerado para manter equilíbrio
    const periodCountMap = new Map();
    for (const p of eligiblePublishers) {
        periodCountMap.set(p.id, 0);
    }
    /* =========================================================
     * 9. Lidar com o modo: Reconcile vs Append
     * ========================================================= */
    const rotativeSlots = arrangement.timeSlots.filter(s => s.is_rotative);
    const rotativeSlotIds = rotativeSlots.map(s => s.id);
    if (mode === "reconcile" && rotativeSlotIds.length > 0) {
        // Busca e remove designações existentes dos horários rotativos no período
        for (const slotId of rotativeSlotIds) {
            const existing = await publicWitnessAssignmentRepository_1.publicWitnessAssignmentRepository.find({
                where: {
                    time_slot_id: slotId,
                    date: (0, typeorm_1.Between)(startDate, endDate)
                },
                relations: ["publishers"]
            });
            for (const item of existing) {
                if ((_c = item.publishers) === null || _c === void 0 ? void 0 : _c.length) {
                    await publicWitnessAssignmentPublisherRepository_1.publicWitnessAssignmentPublisherRepository.remove(item.publishers);
                }
                await publicWitnessAssignmentRepository_1.publicWitnessAssignmentRepository.remove(item);
            }
        }
    }
    /* =========================================================
     * 10. Geração do Rodízio
     * ========================================================= */
    let totalAssignmentsCreated = 0;
    for (const date of validDates) {
        const assignedOnDate = new Set();
        // Bloqueia dirigentes de campo do dia
        const leadersToday = fieldLeadersByDate.get(date);
        if (leadersToday) {
            leadersToday.forEach(id => assignedOnDate.add(id));
        }
        // Bloqueia publishers fixos dos horários fixos
        for (const slot of arrangement.timeSlots) {
            if (!slot.is_rotative && ((_d = slot.defaultPublishers) === null || _d === void 0 ? void 0 : _d.length)) {
                slot.defaultPublishers.forEach(dp => assignedOnDate.add(dp.publisher_id));
            }
        }
        // Processa os horários rotativos
        // Ordena slots: dá prioridade a slots que possuem mais restrições/preferências específicas
        const sortedRotativeSlots = [...rotativeSlots].sort((a, b) => {
            var _a, _b, _c, _d;
            const aPrefs = (_b = (_a = a.preferences) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
            const bPrefs = (_d = (_c = b.preferences) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0;
            if (aPrefs !== bPrefs)
                return bPrefs - aPrefs;
            return a.order - b.order;
        });
        for (const slot of sortedRotativeSlots) {
            let existingAssignment = await publicWitnessAssignmentRepository_1.publicWitnessAssignmentRepository.findOne({
                where: {
                    time_slot_id: slot.id,
                    date
                },
                relations: ["publishers", "publishers.publisher"]
            });
            let currentPublishers = [];
            if (existingAssignment && mode === "append") {
                currentPublishers = (_f = (_e = existingAssignment.publishers) === null || _e === void 0 ? void 0 : _e.map(p => p.publisher_id)) !== null && _f !== void 0 ? _f : [];
                currentPublishers.forEach(id => {
                    assignedOnDate.add(id);
                    periodCountMap.set(id, (periodCountMap.get(id) || 0) + 1);
                });
            }
            const neededCount = Math.max(0, publishersPerSlot - currentPublishers.length);
            if (neededCount === 0)
                continue;
            // Filtra candidatos elegíveis para este slot nesta data
            const candidates = eligiblePublishers.filter(pub => {
                // 1. Não pode estar indisponível
                if (isPublisherUnavailable(pub.id, date))
                    return false;
                // 2. Não pode estar designado para outro slot ou saída no mesmo dia
                if (assignedOnDate.has(pub.id))
                    return false;
                // 3. Regra estrita de preferência de horários
                if (!canPublisherTakeSlot(pub.id, slot.id))
                    return false;
                return true;
            });
            // Ordena candidatos de acordo com prioridade e rodízio justo
            candidates.sort((a, b) => {
                var _a, _b;
                // A. Prioridade para quem tem preferência expressa por este slot
                const aHasPref = ((_a = publisherSlotPreferences.get(a.id)) === null || _a === void 0 ? void 0 : _a.has(slot.id)) ? 1 : 0;
                const bHasPref = ((_b = publisherSlotPreferences.get(b.id)) === null || _b === void 0 ? void 0 : _b.has(slot.id)) ? 1 : 0;
                if (aHasPref !== bHasPref)
                    return bHasPref - aHasPref;
                // B. Menos designações no período atual (equilíbrio no mês)
                const countA = periodCountMap.get(a.id) || 0;
                const countB = periodCountMap.get(b.id) || 0;
                if (countA !== countB)
                    return countA - countB;
                // C. Última designação no histórico anterior (mais tempo sem sair tem prioridade)
                const lastA = lastAssignedDateMap.get(a.id);
                const lastB = lastAssignedDateMap.get(b.id);
                if (!lastA && lastB)
                    return -1;
                if (lastA && !lastB)
                    return 1;
                if (lastA && lastB) {
                    const diff = (0, dayjs_1.default)(lastA).valueOf() - (0, dayjs_1.default)(lastB).valueOf();
                    if (diff !== 0)
                        return diff;
                }
                // D. Desempate estável por nome
                return a.fullName.localeCompare(b.fullName);
            });
            const selected = candidates.slice(0, neededCount);
            if (selected.length === 0)
                continue;
            // Cria ou atualiza assignment
            if (!existingAssignment) {
                existingAssignment = publicWitnessAssignmentRepository_1.publicWitnessAssignmentRepository.create({
                    time_slot_id: slot.id,
                    date
                });
                await publicWitnessAssignmentRepository_1.publicWitnessAssignmentRepository.save(existingAssignment);
            }
            for (let i = 0; i < selected.length; i++) {
                const pub = selected[i];
                const order = currentPublishers.length + i + 1;
                const assignmentPub = publicWitnessAssignmentPublisherRepository_1.publicWitnessAssignmentPublisherRepository.create({
                    assignment_id: existingAssignment.id,
                    publisher_id: pub.id,
                    order
                });
                await publicWitnessAssignmentPublisherRepository_1.publicWitnessAssignmentPublisherRepository.save(assignmentPub);
                assignedOnDate.add(pub.id);
                periodCountMap.set(pub.id, (periodCountMap.get(pub.id) || 0) + 1);
                lastAssignedDateMap.set(pub.id, date);
                totalAssignmentsCreated++;
            }
        }
    }
    return {
        message: "Programação de testemunho público gerada com sucesso!",
        totalAssignments: totalAssignmentsCreated,
        datesProcessed: validDates.length
    };
}
exports.generatePublicWitnessSchedules = generatePublicWitnessSchedules;
