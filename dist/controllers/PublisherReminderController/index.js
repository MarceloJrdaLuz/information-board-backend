"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const api_errors_1 = require("../../helpers/api-errors");
const resolveReminderOccurrence_1 = require("../../helpers/resolveReminderOccurrence");
const publisherReminderRepository_1 = require("../../repositories/publisherReminderRepository");
const publisherRepository_1 = require("../../repositories/publisherRepository");
class PublisherReminderController {
    /* =======================
       CREATE
    ======================= */
    async create(req, res) {
        const { publisher_id } = req.params;
        const { title, description, startDate, endDate, isRecurring, recurrenceIntervalDays, recurrenceCount } = req.body;
        if (!title)
            throw new api_errors_1.BadRequestError("Title is required");
        if (!startDate)
            throw new api_errors_1.BadRequestError("startDate is required");
        if (!endDate) {
            throw new api_errors_1.BadRequestError("endDate is required");
        }
        if ((0, dayjs_1.default)(endDate).isBefore((0, dayjs_1.default)(startDate), "day")) {
            throw new api_errors_1.BadRequestError("endDate cannot be before startDate");
        }
        if (isRecurring && !recurrenceIntervalDays) {
            throw new api_errors_1.BadRequestError("recurrenceIntervalDays is required for recurring reminders");
        }
        const publisher = await publisherRepository_1.publisherRepository.findOneBy({ id: publisher_id });
        if (!publisher)
            throw new api_errors_1.NotFoundError("Publisher not found");
        const reminder = publisherReminderRepository_1.publisherReminderRepository.create({
            title,
            description: description !== null && description !== void 0 ? description : null,
            startDate: (0, dayjs_1.default)(startDate).format("YYYY-MM-DD"),
            endDate: endDate ? (0, dayjs_1.default)(endDate).format("YYYY-MM-DD") : null,
            isRecurring: isRecurring !== null && isRecurring !== void 0 ? isRecurring : false,
            recurrenceIntervalDays: isRecurring ? recurrenceIntervalDays : null,
            recurrenceCount: isRecurring ? recurrenceCount !== null && recurrenceCount !== void 0 ? recurrenceCount : null : null,
            publisher
        });
        const saved = await publisherReminderRepository_1.publisherReminderRepository.save(reminder);
        return res.status(201).json(saved);
    }
    /* =======================
       UPDATE (UNITÁRIO)
    ======================= */
    async update(req, res) {
        const { reminder_id } = req.params;
        const reminder = await publisherReminderRepository_1.publisherReminderRepository.findOne({
            where: { id: reminder_id },
            relations: ["publisher"]
        });
        if (!reminder)
            throw new api_errors_1.NotFoundError("Reminder not found");
        const { title, description, startDate, endDate, isRecurring, recurrenceIntervalDays, recurrenceCount, isActive } = req.body;
        if (title !== undefined)
            reminder.title = title;
        if (description !== undefined)
            reminder.description = description;
        if (startDate !== undefined) {
            reminder.startDate = (0, dayjs_1.default)(startDate).format("YYYY-MM-DD");
        }
        if (endDate !== undefined) {
            const start = startDate
                ? (0, dayjs_1.default)(startDate)
                : (0, dayjs_1.default)(reminder.startDate);
            if ((0, dayjs_1.default)(endDate).isBefore(start, "day")) {
                throw new api_errors_1.BadRequestError("endDate cannot be before startDate");
            }
            reminder.endDate = (0, dayjs_1.default)(endDate).format("YYYY-MM-DD");
        }
        if (isRecurring !== undefined) {
            reminder.isRecurring = isRecurring;
            if (!isRecurring) {
                reminder.recurrenceIntervalDays = null;
                reminder.recurrenceCount = null;
            }
        }
        if (recurrenceIntervalDays !== undefined) {
            reminder.recurrenceIntervalDays = recurrenceIntervalDays;
        }
        if (recurrenceCount !== undefined) {
            reminder.recurrenceCount = recurrenceCount;
        }
        if (isActive !== undefined) {
            reminder.isActive = isActive;
        }
        const saved = await publisherReminderRepository_1.publisherReminderRepository.save(reminder);
        return res.json(saved);
    }
    /* =======================
       DELETE
    ======================= */
    async delete(req, res) {
        const { reminder_id } = req.params;
        const reminder = await publisherReminderRepository_1.publisherReminderRepository.findOneBy({ id: reminder_id });
        if (!reminder)
            throw new api_errors_1.NotFoundError("Reminder not found");
        await publisherReminderRepository_1.publisherReminderRepository.remove(reminder);
        return res.status(204).end();
    }
    async getOne(req, res) {
        const { reminder_id } = req.params;
        const reminder = await publisherReminderRepository_1.publisherReminderRepository.findOne({
            where: { id: reminder_id },
            relations: ["publisher"]
        });
        if (!reminder) {
            throw new api_errors_1.NotFoundError("Reminder not found");
        }
        return res.json(reminder);
    }
    /* =======================
       GET ACTIVE (DASHBOARD)
    ======================= */
    async getActive(req, res) {
        const { publisher_id } = req.params;
        const reminders = await publisherReminderRepository_1.publisherReminderRepository.find({
            where: { publisher: { id: publisher_id }, isActive: true },
            order: { created_at: "ASC" }
        });
        const today = (0, dayjs_1.default)();
        const activeReminders = reminders
            .map(reminder => (0, resolveReminderOccurrence_1.resolveReminderOccurrence)(reminder, today))
            .filter(Boolean);
        return res.json(activeReminders);
    }
    /* =======================
       GET ALL (GESTÃO)
    ======================= */
    async getAll(req, res) {
        const { publisher_id } = req.params;
        const reminders = await publisherReminderRepository_1.publisherReminderRepository.find({
            where: { publisher: { id: publisher_id } },
            order: { created_at: "DESC" }
        });
        return res.json(reminders);
    }
    /* =======================
    MARCAR COMO CONCLUÍDO
 ======================= */
    async complete(req, res) {
        const { reminder_id } = req.params;
        // busca o lembrete
        const reminder = await publisherReminderRepository_1.publisherReminderRepository.findOne({
            where: { id: reminder_id }
        });
        if (!reminder)
            throw new api_errors_1.NotFoundError("Reminder not found");
        const today = (0, dayjs_1.default)();
        // resolve o ciclo atual
        const currentCycle = (0, resolveReminderOccurrence_1.resolveReminderOccurrence)(reminder, today);
        if (!currentCycle) {
            throw new api_errors_1.BadRequestError("No active cycle to complete for this reminder");
        }
        // marca completed_until até o fim do ciclo atual
        reminder.completed_until = currentCycle.endDate;
        // salva
        await publisherReminderRepository_1.publisherReminderRepository.save(reminder);
        return res.json({
            message: "Reminder completed for the current cycle",
            completed_until: reminder.completed_until
        });
    }
}
exports.default = new PublisherReminderController();
