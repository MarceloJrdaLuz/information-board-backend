import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { Response } from "express";
import { In, MoreThanOrEqual } from "typeorm";
import { convertMeetingDayPortugueseToIso } from "../../functions/cleaningFunctions";
import { organizePublishersByFamily } from "../../functions/organizePublishersByFamily";
import { cleaningExceptionRepository } from "../../repositories/cleaningExceptionRepository";
import { cleaningGroupRepository } from "../../repositories/cleaningGroupRepository";
import { cleaningScheduleConfigRepository } from "../../repositories/cleaningScheduleConfigRepository";
import { cleaningScheduleRepository } from "../../repositories/cleaningScheduleRepository";
import { congregationRepository } from "../../repositories/congregationRepository";
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

        const congregation = await congregationRepository.findOne({ where: { id: congregation_id } });
        if (!congregation) return res.status(404).json({ message: "Congregation not found" });

        const config = await cleaningScheduleConfigRepository.findOne({
            where: { congregation: { id: congregation.id } }
        });
        if (!config) return res.status(404).json({ message: "Cleaning schedule config not found" });

        const groups = await cleaningGroupRepository.find({
            where: { congregation: { id: congregation.id } },
            order: { order: "ASC" }
        });
        if (!groups.length) return res.status(404).json({ message: "No groups found" });

        const exceptions = await cleaningExceptionRepository.find({
            where: { congregation: { id: congregation.id } }
        });
        const exceptionDates = new Set(exceptions.map(e => e.date));

        // 🔹 Deleta programações existentes no intervalo
        await cleaningScheduleRepository.delete({
            congregation: { id: congregation.id },
            date: In(
                Array.from({ length: endDate.diff(startDate, "day") + 1 }, (_, i) =>
                    startDate.clone().add(i, "day").format("YYYY-MM-DD")
                )
            )
        });

        const newSchedule = [];
        let groupIndex = 0;

        if (config.mode === CleaningScheduleMode.WEEKLY) {
            let current = startDate.clone().isoWeekday(1);
            if (current.isBefore(startDate)) current = current.add(1, "week");

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
        } else {
            const midweekDay = convertMeetingDayPortugueseToIso(congregation.dayMeetingLifeAndMinistary); // ex: 3
            const endweekDay = convertMeetingDayPortugueseToIso(congregation.dayMeetingPublic!);       // ex: 7
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

        const saved = await cleaningScheduleRepository.save(newSchedule);
        return res.status(200).json({ schedule: saved });
    }

    async getFutureSchedules(
        req: ParamsCustomRequest<{ congregation_id: string }>,
        res: Response
    ) {
        const { congregation_id } = req.params;

        const today = dayjs().format("YYYY-MM-DD");

        const schedules = await cleaningScheduleRepository.find({
            where: {
                congregation: { id: congregation_id },
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
}

export default new CleaningScheduleController();
