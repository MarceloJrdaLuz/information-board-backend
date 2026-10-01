"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const isoWeek_1 = __importDefault(require("dayjs/plugin/isoWeek"));
const isSameOrAfter_1 = __importDefault(require("dayjs/plugin/isSameOrAfter"));
const isSameOrBefore_1 = __importDefault(require("dayjs/plugin/isSameOrBefore"));
const typeorm_1 = require("typeorm");
const CleaningSchedule_1 = require("../../entities/CleaningSchedule");
const cleaningFunctions_1 = require("../../functions/cleaningFunctions");
const organizePublishersByFamily_1 = require("../../functions/organizePublishersByFamily");
const api_errors_1 = require("../../helpers/api-errors");
const permissions_1 = require("../../middlewares/permissions");
const cleaningExceptionRepository_1 = require("../../repositories/cleaningExceptionRepository");
const cleaningGroupRepository_1 = require("../../repositories/cleaningGroupRepository");
const cleaningScheduleConfigRepository_1 = require("../../repositories/cleaningScheduleConfigRepository");
const cleaningScheduleRepository_1 = require("../../repositories/cleaningScheduleRepository");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const specialEventRepository_1 = require("../../repositories/specialEventRepository");
const userRepository_1 = require("../../repositories/userRepository");
const cleaning_1 = require("../../types/cleaning");
dayjs_1.default.extend(isoWeek_1.default);
dayjs_1.default.extend(isSameOrBefore_1.default);
dayjs_1.default.extend(isSameOrAfter_1.default);
class CleaningScheduleController {
    async generate(req, res) {
        const { congregation_id } = req.params;
        const { start, end } = req.query;
        if (!start || !end)
            return res.status(400).json({ message: "start and end required" });
        const startDate = (0, dayjs_1.default)(start.toString());
        const endDate = (0, dayjs_1.default)(end.toString());
        if (!startDate.isValid() || !endDate.isValid())
            return res.status(400).json({ message: "Invalid date format" });
        if (endDate.isBefore(startDate))
            return res.status(400).json({ message: "end must be after start" });
        const congregation = await congregationRepository_1.congregationRepository.findOne({
            where: { id: congregation_id }
        });
        if (!congregation)
            return res.status(404).json({ message: "Congregation not found" });
        const config = await cleaningScheduleConfigRepository_1.cleaningScheduleConfigRepository.findOne({
            where: { congregation: { id: congregation.id } }
        });
        if (!config)
            return res.status(404).json({ message: "Cleaning schedule config not found" });
        const groups = await cleaningGroupRepository_1.cleaningGroupRepository.find({
            where: { congregation: { id: congregation.id } },
            order: { order: "ASC" }
        });
        if (!groups.length)
            return res.status(404).json({ message: "No groups found" });
        const exceptions = await cleaningExceptionRepository_1.cleaningExceptionRepository.find({
            where: { congregation: { id: congregation.id } }
        });
        const exceptionDates = new Set(exceptions.map(e => e.date));
        const cleaningSpecialEvents = await specialEventRepository_1.specialEventRepository.find({
            where: {
                congregation_id: congregation.id,
                cancelCleaning: true
            }
        });
        for (const se of cleaningSpecialEvents) {
            const seStart = (0, dayjs_1.default)(se.startDate);
            const seEnd = (0, dayjs_1.default)(se.endDate);
            const rangeStart = se.affectsWholeWeek ? seStart.startOf("isoWeek") : seStart;
            const rangeEnd = se.affectsWholeWeek ? seEnd.endOf("isoWeek") : seEnd;
            let cur = rangeStart.clone();
            while (cur.isSameOrBefore(rangeEnd)) {
                exceptionDates.add(cur.format("YYYY-MM-DD"));
                cur = cur.add(1, "day");
            }
        }
        // 🔹 BUSCA o último agendamento ANTERIOR ao início do novo intervalo
        const lastSchedule = await cleaningScheduleRepository_1.cleaningScheduleRepository.findOne({
            where: {
                congregation_id: congregation.id,
                date: (0, typeorm_1.LessThan)(startDate.format("YYYY-MM-DD"))
            },
            order: { date: "DESC" },
            relations: ["group"]
        });
        // 🔹 Deleta programações existentes no intervalo de forma confiável via QueryBuilder
        await cleaningScheduleRepository_1.cleaningScheduleRepository
            .createQueryBuilder()
            .delete()
            .from(CleaningSchedule_1.CleaningSchedule)
            .where("congregation_id = :congregationId", { congregationId: congregation.id })
            .andWhere("date >= :startDate AND date <= :endDate", {
            startDate: startDate.format("YYYY-MM-DD"),
            endDate: endDate.format("YYYY-MM-DD")
        })
            .execute();
        const newSchedule = [];
        // 🔹 DEFINE o ponto inicial do rodízio
        let groupIndex = 0;
        if (lastSchedule) {
            const lastGroupId = lastSchedule.group.id;
            const lastIndex = groups.findIndex(g => g.id === lastGroupId);
            if (lastIndex !== -1) {
                groupIndex = lastIndex + 1;
            }
        }
        // 🔁 MODO SEMANAL
        if (config.mode === cleaning_1.CleaningScheduleMode.WEEKLY) {
            let current = startDate.clone().isoWeekday(1);
            if (current.isBefore(startDate)) {
                current = current.add(1, "week");
            }
            while (current.isSameOrBefore(endDate)) {
                const dateStr = current.format("YYYY-MM-DD");
                if (!exceptionDates.has(dateStr)) {
                    const group = groups[groupIndex % groups.length];
                    newSchedule.push({
                        date: dateStr,
                        group_id: group.id,
                        congregation_id: congregation.id
                    });
                    groupIndex++;
                }
                current = current.add(1, "week");
            }
        }
        // 🔁 MODO POR DIAS DE REUNIÃO
        else {
            const midweekDay = (0, cleaningFunctions_1.convertMeetingDayPortugueseToIso)(congregation.dayMeetingLifeAndMinistary);
            const endweekDay = (0, cleaningFunctions_1.convertMeetingDayPortugueseToIso)(congregation.dayMeetingPublic);
            let current = startDate.clone();
            while (current.isSameOrBefore(endDate)) {
                const weekday = current.isoWeekday();
                if (weekday === midweekDay || weekday === endweekDay) {
                    const dateStr = current.format("YYYY-MM-DD");
                    if (!exceptionDates.has(dateStr)) {
                        const group = groups[groupIndex % groups.length];
                        newSchedule.push({
                            date: dateStr,
                            group_id: group.id,
                            congregation_id: congregation.id
                        });
                        groupIndex++;
                    }
                }
                current = current.add(1, "day");
            }
        }
        const saved = await cleaningScheduleRepository_1.cleaningScheduleRepository.save(newSchedule);
        return res.status(200).json({ schedule: saved });
    }
    async getFutureSchedules(req, res) {
        const { congregation_id } = req.params;
        const today = (0, dayjs_1.default)().format("YYYY-MM-DD");
        // 1. Busca exceções manuais e eventos especiais com cancelCleaning
        const exceptions = await cleaningExceptionRepository_1.cleaningExceptionRepository.find({
            where: { congregation: { id: congregation_id } }
        });
        const blockedDates = new Set(exceptions.map(e => e.date));
        const cleaningSpecialEvents = await specialEventRepository_1.specialEventRepository.find({
            where: {
                congregation_id,
                cancelCleaning: true
            }
        });
        for (const se of cleaningSpecialEvents) {
            const seStart = (0, dayjs_1.default)(se.startDate);
            const seEnd = (0, dayjs_1.default)(se.endDate);
            const rangeStart = se.affectsWholeWeek ? seStart.startOf("isoWeek") : seStart;
            const rangeEnd = se.affectsWholeWeek ? seEnd.endOf("isoWeek") : seEnd;
            let cur = rangeStart.clone();
            while (cur.isSameOrBefore(rangeEnd)) {
                blockedDates.add(cur.format("YYYY-MM-DD"));
                cur = cur.add(1, "day");
            }
        }
        // 2. Se houver agendamentos em datas bloqueadas, expurga automaticamente do banco
        if (blockedDates.size > 0) {
            await cleaningScheduleRepository_1.cleaningScheduleRepository
                .createQueryBuilder()
                .delete()
                .from(CleaningSchedule_1.CleaningSchedule)
                .where("congregation_id = :congregation_id", { congregation_id })
                .andWhere("date IN (:...dates)", { dates: Array.from(blockedDates) })
                .execute();
        }
        const schedules = await cleaningScheduleRepository_1.cleaningScheduleRepository.find({
            where: {
                congregation_id,
                date: (0, typeorm_1.MoreThanOrEqual)(today),
            },
            relations: [
                "group",
                "group.publishers",
                "group.publishers.family",
                "group.publishers.family.responsible"
            ],
            order: { date: "ASC" }
        });
        const schedulesProcessed = schedules.map(schedule => {
            const orderedPublishers = (0, organizePublishersByFamily_1.organizePublishersByFamily)(schedule.group.publishers);
            const date = (0, dayjs_1.default)(schedule.date);
            return {
                ...schedule,
                weekdayNumber: date.isoWeekday(),
                weekdayName: date.format("dddd"),
                group: {
                    ...schedule.group,
                    publishers: orderedPublishers
                }
            };
        });
        return res.status(200).json({ schedules: schedulesProcessed });
    }
    async delete(req, res) {
        var _a;
        const { id } = req.params;
        const schedule = await cleaningScheduleRepository_1.cleaningScheduleRepository.findOne({
            where: { id },
            relations: ["congregation"]
        });
        if (!schedule) {
            throw new api_errors_1.NotFoundError("Programação de limpeza não encontrada.");
        }
        const user = await (0, permissions_1.decoder)(req);
        const userRoles = (_a = user === null || user === void 0 ? void 0 : user.roles) === null || _a === void 0 ? void 0 : _a.map(role => role.name);
        if (!(userRoles === null || userRoles === void 0 ? void 0 : userRoles.includes("ADMIN"))) {
            const userCongregation = await userRepository_1.userRepository.find({
                where: {
                    id: user.id,
                    congregation: { id: schedule.congregation.id }
                }
            });
            if (userCongregation.length < 1) {
                throw new api_errors_1.UnauthorizedError("Usuário não tem permissão nesta congregação.");
            }
        }
        await cleaningScheduleRepository_1.cleaningScheduleRepository.delete(id);
        return res.status(204).send();
    }
}
exports.default = new CleaningScheduleController();
