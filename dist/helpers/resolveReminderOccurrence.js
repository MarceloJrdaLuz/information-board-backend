"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveReminderOccurrence = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const isBetween_1 = __importDefault(require("dayjs/plugin/isBetween"));
const isSameOrBefore_1 = __importDefault(require("dayjs/plugin/isSameOrBefore")); // Importante adicionar este plugin
const PublisherReminders_1 = require("../entities/PublisherReminders");
dayjs_1.default.extend(isBetween_1.default);
dayjs_1.default.extend(isSameOrBefore_1.default);
function resolveReminderOccurrence(reminder, today = (0, dayjs_1.default)()) {
    if (!reminder.isActive)
        return null;
    const todayDay = today.startOf("day");
    const start = (0, dayjs_1.default)(reminder.startDate).startOf("day");
    // Duração calculada do evento original
    const durationDays = reminder.endDate
        ? (0, dayjs_1.default)(reminder.endDate).diff(start, "day") + 1
        : 1;
    const completedUntil = reminder.completed_until ? (0, dayjs_1.default)(reminder.completed_until).startOf("day") : null;
    // 1. NÃO RECORRENTE
    if (!reminder.isRecurring) {
        const end = start.add(durationDays - 1, "day");
        if (completedUntil && todayDay.isSameOrBefore(completedUntil))
            return null;
        if (!todayDay.isBetween(start, end, "day", "[]"))
            return null;
        return {
            id: reminder.id,
            title: reminder.title,
            description: reminder.description,
            startDate: start.format("YYYY-MM-DD"),
            endDate: end.format("YYYY-MM-DD"),
            isRecurring: false
        };
    }
    // 2. RECORRENTE
    const interval = reminder.recurrenceInterval || 1;
    const type = reminder.recurrenceType || PublisherReminders_1.RecurrenceType.DAILY;
    // Mapeia o tipo para a unidade do Dayjs
    const unitMap = {
        [PublisherReminders_1.RecurrenceType.DAILY]: 'day',
        [PublisherReminders_1.RecurrenceType.WEEKLY]: 'week',
        [PublisherReminders_1.RecurrenceType.MONTHLY]: 'month',
        [PublisherReminders_1.RecurrenceType.YEARLY]: 'year'
    };
    const unit = unitMap[type];
    // Diferença na unidade específica
    const diff = todayDay.diff(start, unit);
    if (diff < 0)
        return null;
    const cycleIndex = Math.floor(diff / interval);
    // Controle de quantidade
    if (reminder.recurrenceCount && (cycleIndex + 1) > reminder.recurrenceCount)
        return null;
    // Projeta as datas do ciclo atual
    const cycleStart = start.add(cycleIndex * interval, unit);
    const cycleEnd = cycleStart.add(durationDays - 1, "day");
    // Se já concluído este ciclo
    if (completedUntil && cycleEnd.isSameOrBefore(completedUntil))
        return null;
    // Verifica se hoje está dentro da janela do ciclo
    if (!todayDay.isBetween(cycleStart, cycleEnd, "day", "[]"))
        return null;
    return {
        id: reminder.id,
        title: reminder.title,
        description: reminder.description,
        startDate: cycleStart.format("YYYY-MM-DD"),
        endDate: cycleEnd.format("YYYY-MM-DD"),
        isRecurring: true
    };
}
exports.resolveReminderOccurrence = resolveReminderOccurrence;
