import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { Request, Response } from "express";
import { LessThan, MoreThanOrEqual } from "typeorm";
import { CleaningSchedule } from "../../entities/CleaningSchedule";
import { convertMeetingDayPortugueseToIso } from "../../functions/cleaningFunctions";
import { organizePublishersByFamily } from "../../functions/organizePublishersByFamily";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../helpers/api-errors";
import { decoder } from "../../middlewares/permissions";
import { cleaningExceptionRepository } from "../../repositories/cleaningExceptionRepository";
import { cleaningGroupRepository } from "../../repositories/cleaningGroupRepository";
import { cleaningGroupUnavailabilityRepository } from "../../repositories/cleaningGroupUnavailabilityRepository";
import { cleaningScheduleConfigRepository } from "../../repositories/cleaningScheduleConfigRepository";
import { cleaningScheduleRepository } from "../../repositories/cleaningScheduleRepository";
import { congregationRepository } from "../../repositories/congregationRepository";
import { specialEventRepository } from "../../repositories/specialEventRepository";
import { userRepository } from "../../repositories/userRepository";
import { CleaningScheduleMode } from "../../types/cleaning";
import { ParamsCustomRequest } from "../../types/customRequest";

dayjs.extend(isoWeek);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

interface OrderedPublisher {
    id: string;
    fullName: string;
    nickname: string | null;
}

class CleaningScheduleController {
    async generate(req: ParamsCustomRequest<{ congregation_id: string }>, res: Response) {
        const { congregation_id } = req.params;
        const { start, end } = req.query;

        if (!start || !end) return res.status(400).json({ message: "start and end required" });

        const startDate = dayjs(start.toString());
        const endDate = dayjs(end.toString());

        if (!startDate.isValid() || !endDate.isValid())
            return res.status(400).json({ message: "Invalid date format" });

        if (endDate.isBefore(startDate))
            return res.status(400).json({ message: "end must be after start" });

        const congregation = await congregationRepository.findOne({
            where: { id: congregation_id }
        });

        if (!congregation)
            return res.status(404).json({ message: "Congregation not found" });

        const config = await cleaningScheduleConfigRepository.findOne({
            where: { congregation: { id: congregation.id } }
        });

        if (!config)
            return res.status(404).json({ message: "Cleaning schedule config not found" });

        const groups = await cleaningGroupRepository.find({
            where: { congregation: { id: congregation.id } },
            order: { order: "ASC" }
        });

        if (!groups.length)
            return res.status(404).json({ message: "No groups found" });

        const exceptions = await cleaningExceptionRepository.find({
            where: { congregation: { id: congregation.id } }
        });

        const exceptionDates = new Set(exceptions.map(e => e.date));

        const cleaningSpecialEvents = await specialEventRepository.find({
            where: {
                congregation_id: congregation.id,
                cancelCleaning: true
            }
        });

        for (const se of cleaningSpecialEvents) {
            const seStart = dayjs(se.startDate);
            const seEnd = dayjs(se.endDate);
            const rangeStart = se.affectsWholeWeek ? seStart.startOf("isoWeek") : seStart;
            const rangeEnd = se.affectsWholeWeek ? seEnd.endOf("isoWeek") : seEnd;
            let cur = rangeStart.clone();
            while (cur.isSameOrBefore(rangeEnd)) {
                exceptionDates.add(cur.format("YYYY-MM-DD"));
                cur = cur.add(1, "day");
            }
        }

        // 🔹 Busca indisponibilidades de grupos cadastradas para a congregação
        const unavailabilities = await cleaningGroupUnavailabilityRepository.find({
            where: { congregation_id: congregation.id }
        });

        const isGroupUnavailable = (groupId: string, curDate: dayjs.Dayjs) => {
            const curStr = curDate.format("YYYY-MM-DD");
            return unavailabilities.some(u => {
                if (u.group_id !== groupId) return false;
                return curStr >= u.startDate && curStr <= u.endDate;
            });
        };

        // 🔹 Busca histórico recente antes de startDate para manter a continuidade do rodízio
        const prevSchedules = await cleaningScheduleRepository.find({
            where: {
                congregation_id: congregation.id,
                date: LessThan(startDate.format("YYYY-MM-DD"))
            },
            order: { date: "DESC" },
            take: 100
        });

        // 🔹 Deleta programações existentes no intervalo de forma confiável via QueryBuilder
        await cleaningScheduleRepository
            .createQueryBuilder()
            .delete()
            .from(CleaningSchedule)
            .where("congregation_id = :congregationId", { congregationId: congregation.id })
            .andWhere("date >= :startDate AND date <= :endDate", {
                startDate: startDate.format("YYYY-MM-DD"),
                endDate: endDate.format("YYYY-MM-DD")
            })
            .execute();

        const newSchedule: { date: string; group_id: string; congregation_id: string }[] = [];

        // 🔁 MODO SEMANAL
        if (config.mode === CleaningScheduleMode.WEEKLY) {
            // Mapeia o momento da última atribuição de cada grupo
            const lastAssignedWeekly = new Map<string, number>();
            groups.forEach(g => {
                lastAssignedWeekly.set(g.id, g.order * 1000 - 1000000000000);
            });

            for (const s of prevSchedules) {
                if (lastAssignedWeekly.has(s.group_id)) {
                    const ts = dayjs(s.date).valueOf();
                    if (ts > (lastAssignedWeekly.get(s.group_id) ?? 0)) {
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
                        const aTime = lastAssignedWeekly.get(a.id) ?? 0;
                        const bTime = lastAssignedWeekly.get(b.id) ?? 0;
                        if (aTime !== bTime) return aTime - bTime;
                        return a.order - b.order;
                    });

                    let chosen = candidates.find(g => !isGroupUnavailable(g.id, current));
                    if (!chosen) chosen = candidates[0];

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
            const midweekDay = convertMeetingDayPortugueseToIso(
                congregation.dayMeetingLifeAndMinistary
            );

            const endweekDay = convertMeetingDayPortugueseToIso(
                congregation.dayMeetingPublic!
            );

            // Separa os grupos elegíveis para cada reunião
            let midweekGroups = groups.filter(
                g => !g.dayPreference || g.dayPreference === "ALL" || g.dayPreference === "MIDWEEK"
            );
            if (midweekGroups.length === 0) midweekGroups = groups;

            let weekendGroups = groups.filter(
                g => !g.dayPreference || g.dayPreference === "ALL" || g.dayPreference === "WEEKEND"
            );
            if (weekendGroups.length === 0) weekendGroups = groups;

            // Histórico independente de última atribuição
            const lastAssignedMidweek = new Map<string, number>();
            midweekGroups.forEach(g => {
                lastAssignedMidweek.set(g.id, g.order * 1000 - 1000000000000);
            });

            const lastAssignedWeekend = new Map<string, number>();
            weekendGroups.forEach(g => {
                lastAssignedWeekend.set(g.id, g.order * 1000 - 1000000000000);
            });

            for (const s of prevSchedules) {
                const sDate = dayjs(s.date);
                const wDay = sDate.isoWeekday();
                const ts = sDate.valueOf();

                if (wDay === midweekDay && lastAssignedMidweek.has(s.group_id)) {
                    if (ts > (lastAssignedMidweek.get(s.group_id) ?? 0)) {
                        lastAssignedMidweek.set(s.group_id, ts);
                    }
                } else if (wDay === endweekDay && lastAssignedWeekend.has(s.group_id)) {
                    if (ts > (lastAssignedWeekend.get(s.group_id) ?? 0)) {
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
                            const aTime = lastAssignedMidweek.get(a.id) ?? 0;
                            const bTime = lastAssignedMidweek.get(b.id) ?? 0;
                            if (aTime !== bTime) return aTime - bTime;
                            return a.order - b.order;
                        });

                        let chosen = candidates.find(g => !isGroupUnavailable(g.id, current));
                        if (!chosen) chosen = candidates[0];

                        newSchedule.push({
                            date: dateStr,
                            group_id: chosen.id,
                            congregation_id: congregation.id
                        });

                        lastAssignedMidweek.set(chosen.id, current.valueOf());
                    }
                } else if (weekday === endweekDay) {
                    const dateStr = current.format("YYYY-MM-DD");

                    if (!exceptionDates.has(dateStr)) {
                        const candidates = [...weekendGroups].sort((a, b) => {
                            const aTime = lastAssignedWeekend.get(a.id) ?? 0;
                            const bTime = lastAssignedWeekend.get(b.id) ?? 0;
                            if (aTime !== bTime) return aTime - bTime;
                            return a.order - b.order;
                        });

                        let chosen = candidates.find(g => !isGroupUnavailable(g.id, current));
                        if (!chosen) chosen = candidates[0];

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

        const saved = await cleaningScheduleRepository.save(newSchedule);

        return res.status(200).json({ schedule: saved });
    }

    async getFutureSchedules(
        req: ParamsCustomRequest<{ congregation_id: string }>,
        res: Response
    ) {
        const { congregation_id } = req.params;

        const today = dayjs().format("YYYY-MM-DD");

        // 1. Busca exceções manuais e eventos especiais com cancelCleaning
        const exceptions = await cleaningExceptionRepository.find({
            where: { congregation: { id: congregation_id } }
        });
        const blockedDates = new Set(exceptions.map(e => e.date));

        const cleaningSpecialEvents = await specialEventRepository.find({
            where: {
                congregation_id,
                cancelCleaning: true
            }
        });

        for (const se of cleaningSpecialEvents) {
            const seStart = dayjs(se.startDate);
            const seEnd = dayjs(se.endDate);
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
            await cleaningScheduleRepository
                .createQueryBuilder()
                .delete()
                .from(CleaningSchedule)
                .where("congregation_id = :congregation_id", { congregation_id })
                .andWhere("date IN (:...dates)", { dates: Array.from(blockedDates) })
                .execute();
        }

        const schedules = await cleaningScheduleRepository.find({
            where: {
                congregation_id,
                date: MoreThanOrEqual(today),
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
            const orderedPublishers = organizePublishersByFamily(schedule.group.publishers);

            const date = dayjs(schedule.date);

            return {
                ...schedule,
                weekdayNumber: date.isoWeekday(),            // 1 = segunda, 7 = domingo
                weekdayName: date.format("dddd"),            // "quarta-feira"
                group: {
                    ...schedule.group,
                    publishers: orderedPublishers
                }
            };
        });

        return res.status(200).json({ schedules: schedulesProcessed });
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        const schedule = await cleaningScheduleRepository.findOne({
            where: { id },
            relations: ["congregation"]
        });

        if (!schedule) {
            throw new NotFoundError("Programação de limpeza não encontrada.");
        }

        const user = await decoder(req);
        const userRoles = user?.roles?.map(role => role.name);
        if (!userRoles?.includes("ADMIN")) {
            const userCongregation = await userRepository.find({
                where: {
                    id: user.id,
                    congregation: { id: schedule.congregation.id }
                }
            });

            if (userCongregation.length < 1) {
                throw new UnauthorizedError("Usuário não tem permissão nesta congregação.");
            }
        }

        await cleaningScheduleRepository.delete(id);
        return res.status(204).send();
    }

    async updateGroup(req: Request, res: Response) {
        const { id } = req.params;
        const { group_id } = req.body;

        if (!group_id) {
            throw new BadRequestError("group_id é obrigatório.");
        }

        const schedule = await cleaningScheduleRepository.findOne({
            where: { id },
            relations: ["congregation", "group"]
        });

        if (!schedule) {
            throw new NotFoundError("Programação de limpeza não encontrada.");
        }

        const group = await cleaningGroupRepository.findOne({
            where: { id: group_id, congregation: { id: schedule.congregation_id } },
            relations: [
                "publishers",
                "publishers.family",
                "publishers.family.responsible"
            ]
        });

        if (!group) {
            throw new NotFoundError("Grupo de limpeza não encontrado nesta congregação.");
        }

        schedule.group_id = group_id;
        schedule.group = group;
        const saved = await cleaningScheduleRepository.save(schedule);

        const orderedPublishers = organizePublishersByFamily(group.publishers);
        const date = dayjs(saved.date);

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

export default new CleaningScheduleController();
