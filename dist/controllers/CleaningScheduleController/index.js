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
const cleaningFunctions_1 = require("../../functions/cleaningFunctions");
const organizePublishersByFamily_1 = require("../../functions/organizePublishersByFamily");
const cleaningExceptionRepository_1 = require("../../repositories/cleaningExceptionRepository");
const cleaningGroupRepository_1 = require("../../repositories/cleaningGroupRepository");
const cleaningScheduleConfigRepository_1 = require("../../repositories/cleaningScheduleConfigRepository");
const cleaningScheduleRepository_1 = require("../../repositories/cleaningScheduleRepository");
const congregationRepository_1 = require("../../repositories/congregationRepository");
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
        const congregation = await congregationRepository_1.congregationRepository.findOne({ where: { id: congregation_id } });
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
        // 🔹 Deleta programações existentes no intervalo
        await cleaningScheduleRepository_1.cleaningScheduleRepository.delete({
            congregation: { id: congregation.id },
            date: (0, typeorm_1.In)(Array.from({ length: endDate.diff(startDate, "day") + 1 }, (_, i) => startDate.clone().add(i, "day").format("YYYY-MM-DD")))
        });
        const newSchedule = [];
        let groupIndex = 0;
        if (config.mode === cleaning_1.CleaningScheduleMode.WEEKLY) {
            let current = startDate.clone().isoWeekday(1);
            if (current.isBefore(startDate))
                current = current.add(1, "week");
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
        else {
            const midweekDay = (0, cleaningFunctions_1.convertMeetingDayPortugueseToIso)(congregation.dayMeetingLifeAndMinistary); // ex: 3
            const endweekDay = (0, cleaningFunctions_1.convertMeetingDayPortugueseToIso)(congregation.dayMeetingPublic); // ex: 7
            let current = startDate.clone();
            while (current.isSameOrBefore(endDate)) {
                const weekday = current.isoWeekday(); // 1 = segunda, 7 = domingo
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
        const schedules = await cleaningScheduleRepository_1.cleaningScheduleRepository.find({
            where: {
                congregation: { id: congregation_id },
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
            return {
                ...schedule,
                group: {
                    ...schedule.group,
                    publishers: orderedPublishers
                }
            };
        });
        return res.status(200).json({ schedules: schedulesProcessed });
    }
}
exports.default = new CleaningScheduleController();
