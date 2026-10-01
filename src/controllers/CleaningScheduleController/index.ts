import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { Request, Response } from "express";
import { LessThan, MoreThanOrEqual } from "typeorm";
import { CleaningSchedule } from "../../entities/CleaningSchedule";
import { convertMeetingDayPortugueseToIso } from "../../functions/cleaningFunctions";
import { organizePublishersByFamily } from "../../functions/organizePublishersByFamily";
import { NotFoundError, UnauthorizedError } from "../../helpers/api-errors";
import { decoder } from "../../middlewares/permissions";
import { cleaningExceptionRepository } from "../../repositories/cleaningExceptionRepository";
import { cleaningGroupRepository } from "../../repositories/cleaningGroupRepository";
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

        // 🔹 BUSCA o último agendamento ANTERIOR ao início do novo intervalo
        const lastSchedule = await cleaningScheduleRepository.findOne({
            where: {
                congregation_id: congregation.id,
                date: LessThan(startDate.format("YYYY-MM-DD"))
            },
            order: { date: "DESC" },
            relations: ["group"]
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
        if (config.mode === CleaningScheduleMode.WEEKLY) {
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
            const midweekDay = convertMeetingDayPortugueseToIso(
                congregation.dayMeetingLifeAndMinistary
            );

            const endweekDay = convertMeetingDayPortugueseToIso(
                congregation.dayMeetingPublic!
            );

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
}

export default new CleaningScheduleController();
