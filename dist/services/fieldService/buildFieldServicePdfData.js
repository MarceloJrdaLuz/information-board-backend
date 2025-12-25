"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFieldServicePdfData = void 0;
const typeorm_1 = require("typeorm");
const dayjs_1 = __importDefault(require("dayjs"));
const congregationRepository_1 = require("../../repositories/congregationRepository");
const fieldServiceExceptionRepository_1 = require("../../repositories/fieldServiceExceptionRepository");
const fieldServiceTemplateRepository_1 = require("../../repositories/fieldServiceTemplateRepository");
const fieldServiceScheduleRepository_1 = require("../../repositories/fieldServiceScheduleRepository");
/* ===================== CONSTANTS ===================== */
const WEEKDAY_LABELS = {
    0: "Domingo",
    1: "Segunda-feira",
    2: "Terça-feira",
    3: "Quarta-feira",
    4: "Quinta-feira",
    5: "Sexta-feira",
    6: "Sábado",
};
const weekdayLabel = (weekday) => { var _a; return (_a = WEEKDAY_LABELS[weekday]) !== null && _a !== void 0 ? _a : "—"; };
/* ===================== SERVICE ===================== */
async function buildFieldServicePdfData(congregation_id, start, end) {
    var _a, _b, _c;
    const startStr = (0, dayjs_1.default)(start).format("YYYY-MM-DD");
    const endStr = (0, dayjs_1.default)(end).format("YYYY-MM-DD");
    /* ===== Congregação ===== */
    const congregation = await congregationRepository_1.congregationRepository.findOneByOrFail({
        id: congregation_id,
    });
    /* ===== Templates ativos ===== */
    const templates = await fieldServiceTemplateRepository_1.fieldServiceTemplateRepository.find({
        where: { congregation_id, active: true },
        relations: ["leader"],
    });
    /* ===== Exceptions do período ===== */
    const exceptions = await fieldServiceExceptionRepository_1.fieldServiceExceptionRepository.find({
        where: {
            congregation_id,
            date: (0, typeorm_1.Between)(startStr, endStr),
        },
    });
    const exceptionMap = new Map();
    exceptions.forEach(e => {
        exceptionMap.set(e.date, e.reason);
    });
    /* ===================== FIXED ===================== */
    const fixedSchedules = templates
        .filter(t => t.type === "FIXED")
        .map(t => {
        var _a, _b, _c;
        return ({
            weekday: weekdayLabel(t.weekday),
            weekdayIndex: t.weekday,
            time: t.time.slice(0, 5),
            location: t.location,
            leader: ((_a = t.leader) === null || _a === void 0 ? void 0 : _a.nickname) ? t.leader.nickname : (_c = (_b = t.leader) === null || _b === void 0 ? void 0 : _b.fullName) !== null && _c !== void 0 ? _c : "—",
        });
    }).sort((a, b) => {
        if (a.weekdayIndex !== b.weekdayIndex) {
            return a.weekdayIndex - b.weekdayIndex;
        }
        return a.time.localeCompare(b.time);
    });
    /* ===================== ROTATION ===================== */
    const rotationTemplates = templates.filter(t => t.type === "ROTATION");
    const templateIds = rotationTemplates.map(t => t.id);
    const schedules = await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.find({
        where: {
            template: {
                id: (0, typeorm_1.In)(templateIds),
            },
            date: (0, typeorm_1.Between)(startStr, endStr),
        },
        relations: ["leader", "template"],
        order: { date: "ASC" },
    });
    const rotationBlocksMap = new Map();
    // Criar blocos para cada template ROTATION
    for (const template of rotationTemplates) {
        const key = `${template.weekday}-${template.time}-${template.location}`;
        if (!rotationBlocksMap.has(key)) {
            rotationBlocksMap.set(key, {
                title: `${weekdayLabel(template.weekday)} – ${template.time.slice(0, 5)} – ${template.location}`,
                weekday: template.weekday,
                time: template.time.slice(0, 5),
                location: template.location,
                schedules: [],
            });
        }
    }
    // Preencher os blocos com agendamentos existentes
    // Preencher os blocos com agendamentos existentes
    for (const schedule of schedules) {
        const template = schedule.template;
        const key = `${template.weekday}-${template.time}-${template.location}`;
        const exceptionReason = exceptionMap.get(schedule.date);
        rotationBlocksMap.get(key).schedules.push({
            date: schedule.date,
            leader: ((_a = schedule.leader) === null || _a === void 0 ? void 0 : _a.nickname) ? schedule.leader.nickname : (_c = (_b = schedule.leader) === null || _b === void 0 ? void 0 : _b.fullName) !== null && _c !== void 0 ? _c : "—",
            exceptionReason: exceptionReason,
        });
    }
    // Incluir exceções que não têm agendamento
    exceptions.forEach(e => {
        const dayOfWeek = (0, dayjs_1.default)(e.date).day();
        rotationTemplates.forEach(template => {
            var _a, _b, _c;
            if (template.weekday === dayOfWeek) {
                const key = `${template.weekday}-${template.time}-${template.location}`;
                const block = rotationBlocksMap.get(key);
                if (!block)
                    return;
                const alreadyExists = block.schedules.some(s => s.date === e.date);
                if (!alreadyExists) {
                    block.schedules.push({
                        date: e.date,
                        leader: ((_a = template.leader) === null || _a === void 0 ? void 0 : _a.nickname) ? template.leader.nickname : (_c = (_b = template.leader) === null || _b === void 0 ? void 0 : _b.fullName) !== null && _c !== void 0 ? _c : "—",
                        exceptionReason: e.reason,
                    });
                }
            }
        });
    });
    // Ordenar cada bloco por data
    rotationBlocksMap.forEach(block => {
        block.schedules.sort((a, b) => (a.date < b.date ? -1 : 1));
    });
    const rotationBlocks = Array.from(rotationBlocksMap.values()).sort((a, b) => {
        if (a.weekday !== b.weekday) {
            return a.weekday - b.weekday;
        }
        return a.time.localeCompare(b.time);
    });
    return {
        congregationName: congregation.name,
        period: {
            start: startStr,
            end: endStr,
        },
        fixedSchedules,
        rotationBlocks,
    };
}
exports.buildFieldServicePdfData = buildFieldServicePdfData;
