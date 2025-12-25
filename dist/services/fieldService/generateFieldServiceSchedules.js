"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFieldServiceSchedules = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const typeorm_1 = require("typeorm");
const fieldServiceExceptionRepository_1 = require("../../repositories/fieldServiceExceptionRepository");
const fieldServiceRotationMembersRepository_1 = require("../../repositories/fieldServiceRotationMembersRepository");
const fieldServiceScheduleRepository_1 = require("../../repositories/fieldServiceScheduleRepository");
const fieldServiceTemplateRepository_1 = require("../../repositories/fieldServiceTemplateRepository");
async function generateFieldServiceSchedules({ template_id, startDate, endDate, mode = "append", }) {
    /* ===============================
     * 1. Buscar template (UM SÓ)
     =============================== */
    const template = await fieldServiceTemplateRepository_1.fieldServiceTemplateRepository.findOne({
        where: { id: template_id },
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
     * 4. Datas APENAS do dia do template
     =============================== */
    const dates = getDatesByWeekday(startDate, endDate, template.weekday);
    /* ===============================
     * 5. Reconcile (opcional)
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
     * 6. Criar schedules
     =============================== */
    let rotationIndex = 0;
    for (const date of dates) {
        if (hasException(date))
            continue;
        const exists = await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.findOne({
            where: {
                template: { id: template.id },
                date,
            },
        });
        if (exists)
            continue;
        const leader = rotation[rotationIndex].publisher;
        await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.save(fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.create({
            template,
            template_id: template.id,
            date,
            leader,
            leader_id: leader.id,
        }));
        rotationIndex = (rotationIndex + 1) % rotation.length;
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
