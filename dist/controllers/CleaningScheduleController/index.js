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
const cleaningGroupUnavailabilityRepository_1 = require("../../repositories/cleaningGroupUnavailabilityRepository");
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
        var _a, _b, _c;
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
        // 🔹 Busca indisponibilidades de grupos cadastradas para a congregação
        const unavailabilities = await cleaningGroupUnavailabilityRepository_1.cleaningGroupUnavailabilityRepository.find({
            where: { congregation_id: congregation.id }
        });
        const isGroupUnavailable = (groupId, curDate) => {
            const curStr = curDate.format("YYYY-MM-DD");
            return unavailabilities.some(u => {
                if (u.group_id !== groupId)
                    return false;
                return curStr >= u.startDate && curStr <= u.endDate;
            });
        };
        // 🔹 Busca histórico recente antes de startDate para manter a continuidade do rodízio
        const prevSchedules = await cleaningScheduleRepository_1.cleaningScheduleRepository.find({
            where: {
                congregation_id: congregation.id,
                date: (0, typeorm_1.LessThan)(startDate.format("YYYY-MM-DD"))
            },
            order: { date: "DESC" },
            take: 100
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
        // 🔁 MODO SEMANAL
        if (config.mode === cleaning_1.CleaningScheduleMode.WEEKLY) {
            // Mapeia o momento da última atribuição de cada grupo
            const lastAssignedWeekly = new Map();
            groups.forEach(g => {
                lastAssignedWeekly.set(g.id, g.order * 1000 - 1000000000000);
            });
            for (const s of prevSchedules) {
                if (lastAssignedWeekly.has(s.group_id)) {
                    const ts = (0, dayjs_1.default)(s.date).valueOf();
                    if (ts > ((_a = lastAssignedWeekly.get(s.group_id)) !== null && _a !== void 0 ? _a : 0)) {
                        lastAssignedWeekly.set(s.group_id, ts);
                    }
                }
            }
            let current = startDate.clone().isoWeekday(1);
            if (current.isBefore(startDate)) {
                current = current.add(1, "week");
            }
            while (current.isSameOrBefore(endDate)) {
                const dateStr = current.format("YYYY-MM-DD");
                if (!exceptionDates.has(dateStr)) {
                    // Ordena pelos que estão há mais tempo sem limpar
                    const candidates = [...groups].sort((a, b) => {
                        var _a, _b;
                        const aTime = (_a = lastAssignedWeekly.get(a.id)) !== null && _a !== void 0 ? _a : 0;
                        const bTime = (_b = lastAssignedWeekly.get(b.id)) !== null && _b !== void 0 ? _b : 0;
                        if (aTime !== bTime)
                            return aTime - bTime;
                        return a.order - b.order;
                    });
                    let chosen = candidates.find(g => !isGroupUnavailable(g.id, current));
                    if (!chosen)
                        chosen = candidates[0];
                    newSchedule.push({
                        date: dateStr,
                        group_id: chosen.id,
                        congregation_id: congregation.id
                    });
                    lastAssignedWeekly.set(chosen.id, current.valueOf());
                }
                current = current.add(1, "week");
            }
        }
        // 🔁 MODO POR DIAS DE REUNIÃO (Filas independentes Meio de Semana & Fim de Semana)
        else {
            const midweekDay = (0, cleaningFunctions_1.convertMeetingDayPortugueseToIso)(congregation.dayMeetingLifeAndMinistary);
            const endweekDay = (0, cleaningFunctions_1.convertMeetingDayPortugueseToIso)(congregation.dayMeetingPublic);
            // Separa os grupos elegíveis para cada reunião
            let midweekGroups = groups.filter(g => !g.dayPreference || g.dayPreference === "ALL" || g.dayPreference === "MIDWEEK");
            if (midweekGroups.length === 0)
                midweekGroups = groups;
            let weekendGroups = groups.filter(g => !g.dayPreference || g.dayPreference === "ALL" || g.dayPreference === "WEEKEND");
            if (weekendGroups.length === 0)
                weekendGroups = groups;
            // Histórico independente de última atribuição
            const lastAssignedMidweek = new Map();
            midweekGroups.forEach(g => {
                lastAssignedMidweek.set(g.id, g.order * 1000 - 1000000000000);
            });
            const lastAssignedWeekend = new Map();
            weekendGroups.forEach(g => {
                lastAssignedWeekend.set(g.id, g.order * 1000 - 1000000000000);
            });
            for (const s of prevSchedules) {
                const sDate = (0, dayjs_1.default)(s.date);
                const wDay = sDate.isoWeekday();
                const ts = sDate.valueOf();
                if (wDay === midweekDay && lastAssignedMidweek.has(s.group_id)) {
                    if (ts > ((_b = lastAssignedMidweek.get(s.group_id)) !== null && _b !== void 0 ? _b : 0)) {
                        lastAssignedMidweek.set(s.group_id, ts);
                    }
                }
                else if (wDay === endweekDay && lastAssignedWeekend.has(s.group_id)) {
                    if (ts > ((_c = lastAssignedWeekend.get(s.group_id)) !== null && _c !== void 0 ? _c : 0)) {
                        lastAssignedWeekend.set(s.group_id, ts);
                    }
                }
            }
            let current = startDate.clone();
            while (current.isSameOrBefore(endDate)) {
                const weekday = current.isoWeekday();
                if (weekday === midweekDay) {
                    const dateStr = current.format("YYYY-MM-DD");
                    if (!exceptionDates.has(dateStr)) {
                        const candidates = [...midweekGroups].sort((a, b) => {
                            var _a, _b;
                            const aTime = (_a = lastAssignedMidweek.get(a.id)) !== null && _a !== void 0 ? _a : 0;
                            const bTime = (_b = lastAssignedMidweek.get(b.id)) !== null && _b !== void 0 ? _b : 0;
                            if (aTime !== bTime)
                                return aTime - bTime;
                            return a.order - b.order;
                        });
                        let chosen = candidates.find(g => !isGroupUnavailable(g.id, current));
                        if (!chosen)
                            chosen = candidates[0];
                        newSchedule.push({
                            date: dateStr,
                            group_id: chosen.id,
                            congregation_id: congregation.id
                        });
                        lastAssignedMidweek.set(chosen.id, current.valueOf());
                    }
                }
                else if (weekday === endweekDay) {
                    const dateStr = current.format("YYYY-MM-DD");
                    if (!exceptionDates.has(dateStr)) {
                        const candidates = [...weekendGroups].sort((a, b) => {
                            var _a, _b;
                            const aTime = (_a = lastAssignedWeekend.get(a.id)) !== null && _a !== void 0 ? _a : 0;
                            const bTime = (_b = lastAssignedWeekend.get(b.id)) !== null && _b !== void 0 ? _b : 0;
                            if (aTime !== bTime)
                                return aTime - bTime;
                            return a.order - b.order;
                        });
                        let chosen = candidates.find(g => !isGroupUnavailable(g.id, current));
                        if (!chosen)
                            chosen = candidates[0];
                        newSchedule.push({
                            date: dateStr,
                            group_id: chosen.id,
                            congregation_id: congregation.id
                        });
                        lastAssignedWeekend.set(chosen.id, current.valueOf());
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
    async updateGroup(req, res) {
        const { id } = req.params;
        const { group_id } = req.body;
        if (!group_id) {
            throw new api_errors_1.BadRequestError("group_id é obrigatório.");
        }
        const schedule = await cleaningScheduleRepository_1.cleaningScheduleRepository.findOne({
            where: { id },
            relations: ["congregation", "group"]
        });
        if (!schedule) {
            throw new api_errors_1.NotFoundError("Programação de limpeza não encontrada.");
        }
        const group = await cleaningGroupRepository_1.cleaningGroupRepository.findOne({
            where: { id: group_id, congregation: { id: schedule.congregation_id } },
            relations: [
                "publishers",
                "publishers.family",
                "publishers.family.responsible"
            ]
        });
        if (!group) {
            throw new api_errors_1.NotFoundError("Grupo de limpeza não encontrado nesta congregação.");
        }
        schedule.group_id = group_id;
        schedule.group = group;
        const saved = await cleaningScheduleRepository_1.cleaningScheduleRepository.save(schedule);
        const orderedPublishers = (0, organizePublishersByFamily_1.organizePublishersByFamily)(group.publishers);
        const date = (0, dayjs_1.default)(saved.date);
        return res.status(200).json({
            ...saved,
            weekdayNumber: date.isoWeekday(),
            weekdayName: date.format("dddd"),
            group: {
                ...group,
                publishers: orderedPublishers
            }
        });
    }
}
exports.default = new CleaningScheduleController();
