"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFieldServiceSchedules = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const isSameOrAfter_1 = __importDefault(require("dayjs/plugin/isSameOrAfter"));
const isSameOrBefore_1 = __importDefault(require("dayjs/plugin/isSameOrBefore"));
const typeorm_1 = require("typeorm");
const fieldServiceExceptionRepository_1 = require("../../repositories/fieldServiceExceptionRepository");
const fieldServiceRotationMembersRepository_1 = require("../../repositories/fieldServiceRotationMembersRepository");
const fieldServiceScheduleRepository_1 = require("../../repositories/fieldServiceScheduleRepository");
const fieldServiceTemplateRepository_1 = require("../../repositories/fieldServiceTemplateRepository");
const publisherUnavailabilityRepository_1 = require("../../repositories/publisherUnavailabilityRepository");
dayjs_1.default.extend(isSameOrBefore_1.default);
dayjs_1.default.extend(isSameOrAfter_1.default);
async function generateFieldServiceSchedules({ template_id, startDate, endDate, mode = "append", }) {
    /* ===============================
     * 1. Buscar template (UM SÓ)
     =============================== */
    const template = await fieldServiceTemplateRepository_1.fieldServiceTemplateRepository.findOne({
        where: { id: template_id },
        relations: ["congregation"],
    });
    if (!template) {
        throw new Error("Field service template not found");
    }
    /* ===============================
     * 2. Buscar rodízio
     =============================== */
    const rotation = await fieldServiceRotationMembersRepository_1.fieldServiceRotationMemberRepository.find({
        where: { template: { id: template.id } },
        relations: ["publisher"],
        order: { order: "ASC" },
    });
    if (!rotation.length)
        return;
    const publisherIds = rotation.map((r) => r.publisher_id);
    /* ===============================
     * 3. Buscar exceções do período
     =============================== */
    const exceptions = await fieldServiceExceptionRepository_1.fieldServiceExceptionRepository.find({
        where: { date: (0, typeorm_1.Between)(startDate, endDate) },
        relations: ["template"],
    });
    const hasException = (date) => exceptions.some((e) => e.date === date &&
        (!e.template || e.template.id === template.id));
    /* ===============================
     * 4. Buscar indisponibilidades ativas no período
     =============================== */
    const unavailabilities = await publisherUnavailabilityRepository_1.publisherUnavailabilityRepository
        .createQueryBuilder("unav")
        .where("unav.publisher_id IN (:...publisherIds)", { publisherIds })
        .andWhere("unav.startDate <= :endDate AND unav.endDate >= :startDate", {
        startDate,
        endDate,
    })
        .getMany();
    const isPublisherUnavailable = (pubId, date) => {
        return unavailabilities.some((u) => u.publisher_id === pubId &&
            (0, dayjs_1.default)(date).isSameOrAfter((0, dayjs_1.default)(u.startDate), "day") &&
            (0, dayjs_1.default)(date).isSameOrBefore((0, dayjs_1.default)(u.endDate), "day"));
    };
    /* ===============================
     * 5. Mapear histórico de designações de cada membro antes do período
     =============================== */
    const pastSchedules = await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.find({
        where: {
            leader: { id: (0, typeorm_1.In)(publisherIds) },
            date: (0, typeorm_1.LessThan)(startDate),
        },
        order: { date: "DESC" },
    });
    const lastAssignedDateMap = new Map();
    for (const s of pastSchedules) {
        if (s.leader_id && !lastAssignedDateMap.has(s.leader_id)) {
            lastAssignedDateMap.set(s.leader_id, s.date);
        }
    }
    /* ===============================
     * 6. Datas APENAS do dia do template
     =============================== */
    const dates = getDatesByWeekday(startDate, endDate, template.weekday);
    /* ===============================
     * 7. Reconcile (opcional)
     =============================== */
    if (mode === "reconcile") {
        const existing = await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.find({
            where: {
                template: { id: template.id },
                date: (0, typeorm_1.Between)(startDate, endDate),
            },
        });
        if (existing.length) {
            await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.remove(existing);
        }
    }
    /* ===============================
     * 8. Criar schedules com algoritmo inteligente
     =============================== */
    for (const date of dates) {
        if (hasException(date))
            continue;
        const exists = await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.findOne({
            where: {
                template: { id: template.id },
                date,
            },
        });
        if (exists) {
            if (exists.leader_id) {
                lastAssignedDateMap.set(exists.leader_id, date);
            }
            continue;
        }
        // Filtrar membros do rodízio que NÃO estão indisponíveis na data
        const availableMembers = rotation.filter((m) => !isPublisherUnavailable(m.publisher_id, date));
        // Se todos estiverem indisponíveis na data, fallback para todos os membros do rodízio
        const candidates = availableMembers.length > 0 ? [...availableMembers] : [...rotation];
        // Ordenar membros disponíveis por:
        // 1. Mais tempo sem dirigir (quem nunca dirigiu primeiro, ou data mais antiga)
        // 2. Ordem de cadastro no rodízio como critério de desempate
        candidates.sort((a, b) => {
            const dateA = lastAssignedDateMap.get(a.publisher_id);
            const dateB = lastAssignedDateMap.get(b.publisher_id);
            // Quem nunca dirigiu (null/undefined) tem prioridade máxima
            if (!dateA && dateB)
                return -1;
            if (dateA && !dateB)
                return 1;
            // Ambos já dirigiram: quem dirigiu há mais tempo (menor timestamp) vem antes
            if (dateA && dateB) {
                const diff = (0, dayjs_1.default)(dateA).valueOf() - (0, dayjs_1.default)(dateB).valueOf();
                if (diff !== 0)
                    return diff;
            }
            // Desempate pela ordem cadastrada no rodízio
            return a.order - b.order;
        });
        const selectedMember = candidates[0];
        const leader = selectedMember.publisher;
        await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.save(fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.create({
            template,
            template_id: template.id,
            date,
            leader,
            leader_id: leader.id,
        }));
        // Atualiza a data da última designação para as próximas semanas do período
        lastAssignedDateMap.set(selectedMember.publisher_id, date);
    }
}
exports.generateFieldServiceSchedules = generateFieldServiceSchedules;
/* =========================
   Helpers
========================= */
function getDatesByWeekday(start, end, weekday) {
    const dates = [];
    let current = (0, dayjs_1.default)(start);
    while (current.isSameOrBefore(end)) {
        if (current.day() === weekday) {
            dates.push(current.format("YYYY-MM-DD"));
        }
        current = current.add(1, "day");
    }
    return dates;
}
