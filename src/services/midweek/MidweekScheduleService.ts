import dayjs from "dayjs";
import { Between } from "typeorm";
import { AppDataSource } from "../../data-source";
import { MidweekMeetingPart, MidweekRoom } from "../../entities/MidweekMeetingPart";
import { MidweekSchedule, MidweekSpecialType } from "../../entities/MidweekSchedule";
import { MidweekPartType, MidweekSection } from "../../entities/MidweekWorkbookPart";
import { MidweekWorkbookWeek } from "../../entities/MidweekWorkbookWeek";
import { midweekMeetingPartRepository } from "../../repositories/midweekMeetingPartRepository";
import { midweekScheduleRepository } from "../../repositories/midweekScheduleRepository";
import { midweekWorkbookWeekRepository } from "../../repositories/midweekWorkbookWeekRepository";

export class MidweekScheduleService {
    async getOrGenerateMonthSchedules(congregationId: string, year: number, month: number): Promise<MidweekSchedule[]> {
        const startDate = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).startOf('month');
        const endDate = startDate.endOf('month');

        const firstDayRange = startDate.subtract(7, 'day').format('YYYY-MM-DD');
        const lastDayRange = endDate.add(7, 'day').format('YYYY-MM-DD');

        const workbookWeeks = await midweekWorkbookWeekRepository.find({
            where: {
                weekDate: Between(firstDayRange, lastDayRange)
            },
            relations: ["parts"]
        });

        const existingSchedules = await midweekScheduleRepository.find({
            where: {
                congregation_id: congregationId,
                weekDate: Between(firstDayRange, lastDayRange)
            },
            relations: [
                "chairman",
                "openingPrayer",
                "closingPrayer",
                "auxCounselor1",
                "auxCounselor2",
                "cbsConductor",
                "cbsReader",
                "parts",
                "parts.assignedPublisher",
                "parts.assistantPublisher"
            ],
            order: {
                parts: {
                    orderIndex: "ASC"
                }
            }
        });

        const existingMap = new Map<string, MidweekSchedule>();
        existingSchedules.forEach(s => {
            if (s.parts) {
                s.parts.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
            }
            existingMap.set(s.weekDate, s);
        });

        const schedulesToReturn: MidweekSchedule[] = [];

        for (const wbWeek of workbookWeeks) {
            const weekDayjs = dayjs(wbWeek.weekDate);
            const isWeekInMonth = weekDayjs.month() + 1 === month && weekDayjs.year() === year;

            if (existingMap.has(wbWeek.weekDate)) {
                const existing = existingMap.get(wbWeek.weekDate)!;
                if (isWeekInMonth) {
                    schedulesToReturn.push(existing);
                }
                continue;
            }

            const newSchedule = await this.instantiateScheduleFromWorkbook(congregationId, wbWeek);
            if (isWeekInMonth) {
                schedulesToReturn.push(newSchedule);
            }
        }

        return schedulesToReturn.sort((a, b) => a.weekDate.localeCompare(b.weekDate));
    }

    async instantiateScheduleFromWorkbook(congregationId: string, wbWeek: MidweekWorkbookWeek): Promise<MidweekSchedule> {
        return await AppDataSource.transaction(async (manager) => {
            const schedule = new MidweekSchedule();
            schedule.congregation_id = congregationId;
            schedule.workbook_week_id = wbWeek.id;
            schedule.weekDate = wbWeek.weekDate;
            schedule.meetingDate = wbWeek.weekDate;
            schedule.weeklyBibleReading = wbWeek.weeklyBibleReading;
            schedule.watchtowerStudyTheme = wbWeek.watchtowerStudyTheme;
            schedule.songOpen = wbWeek.songOpen;
            schedule.songMiddle = wbWeek.songMiddle;
            schedule.songEnd = wbWeek.songEnd;
            schedule.isSpecial = false;
            schedule.specialType = MidweekSpecialType.NONE;

            const savedSchedule = await manager.save(MidweekSchedule, schedule);

            if (wbWeek.parts && wbWeek.parts.length > 0) {
                const meetingParts: MidweekMeetingPart[] = wbWeek.parts.map(wp => {
                    const mp = new MidweekMeetingPart();
                    mp.schedule_id = savedSchedule.id;
                    mp.workbook_part_id = wp.id;
                    mp.section = wp.section;
                    mp.partType = wp.partType;
                    mp.title = wp.title;
                    mp.sourceMaterial = wp.sourceMaterial;
                    mp.timeMinutes = wp.timeMinutes;
                    mp.lessonNumber = wp.lessonNumber;
                    mp.studyPoint = wp.studyPoint;
                    mp.studyPointDescription = wp.studyPointDescription;
                    mp.brochure = wp.brochure;
                    mp.requiresAssistant = wp.requiresAssistant;
                    mp.method = wp.method;
                    mp.prompts = wp.prompts;
                    mp.room = MidweekRoom.MAIN;
                    mp.orderIndex = wp.orderIndex;
                    mp.isActive = true;
                    mp.isCompleted = false;
                    return mp;
                });

                savedSchedule.parts = await manager.save(MidweekMeetingPart, meetingParts);
            } else {
                savedSchedule.parts = [];
            }

            return savedSchedule;
        });
    }

    async getScheduleById(scheduleId: string, congregationId: string): Promise<MidweekSchedule> {
        const schedule = await midweekScheduleRepository.findOne({
            where: { id: scheduleId, congregation_id: congregationId },
            relations: [
                "chairman",
                "openingPrayer",
                "closingPrayer",
                "auxCounselor1",
                "auxCounselor2",
                "cbsConductor",
                "cbsReader",
                "parts",
                "parts.assignedPublisher",
                "parts.assistantPublisher"
            ],
            order: {
                parts: {
                    orderIndex: "ASC"
                }
            }
        });

        if (!schedule) {
            throw new Error("Programação não encontrada.");
        }

        return schedule;
    }

    async updateSchedule(scheduleId: string, congregationId: string, data: Partial<MidweekSchedule>): Promise<MidweekSchedule> {
        const schedule = await this.getScheduleById(scheduleId, congregationId);

        if (data.meetingDate !== undefined) schedule.meetingDate = data.meetingDate;
        if (data.isSpecial !== undefined) schedule.isSpecial = data.isSpecial;
        if (data.specialType !== undefined) schedule.specialType = data.specialType;
        if (data.specialName !== undefined) schedule.specialName = data.specialName;
        if (data.notes !== undefined) schedule.notes = data.notes;
        if (data.songOpen !== undefined) schedule.songOpen = data.songOpen;
        if (data.songMiddle !== undefined) schedule.songMiddle = data.songMiddle;
        if (data.songEnd !== undefined) schedule.songEnd = data.songEnd;

        // Se a semana for marcada como Assembleia, Congresso, Celebração ou evento especial sem reunião:
        // Limpa automaticamente todos os participantes designados da reunião!
        const clearsParticipants = schedule.isSpecial === true &&
            schedule.specialType !== MidweekSpecialType.NONE &&
            schedule.specialType !== MidweekSpecialType.CIRCUIT_OVERSEER_VISIT;

        if (clearsParticipants) {
            schedule.chairman = null;
            schedule.chairman_id = null;
            schedule.openingPrayer = null;
            schedule.opening_prayer_id = null;
            schedule.closingPrayer = null;
            schedule.closing_prayer_id = null;
            schedule.auxCounselor1 = null;
            schedule.aux_counselor_1_id = null;
            schedule.auxCounselor2 = null;
            schedule.aux_counselor_2_id = null;
            schedule.cbsConductor = null;
            schedule.cbs_conductor_id = null;
            schedule.cbsReader = null;
            schedule.cbs_reader_id = null;

            // Desmarca todos os oradores/ajudantes das partes desta semana
            await midweekMeetingPartRepository
                .createQueryBuilder()
                .update(MidweekMeetingPart)
                .set({
                    assigned_publisher_id: null,
                    assistant_publisher_id: null,
                    custom_speaker_name: null
                })
                .where("schedule_id = :scheduleId", { scheduleId: schedule.id })
                .execute();
        } else {
            if (data.chairman_id !== undefined) {
                schedule.chairman_id = data.chairman_id;
                schedule.chairman = data.chairman_id ? ({ id: data.chairman_id } as any) : null;
            }
            if (data.opening_prayer_id !== undefined) {
                schedule.opening_prayer_id = data.opening_prayer_id;
                schedule.openingPrayer = data.opening_prayer_id ? ({ id: data.opening_prayer_id } as any) : null;
            }
            if (data.closing_prayer_id !== undefined) {
                schedule.closing_prayer_id = data.closing_prayer_id;
                schedule.closingPrayer = data.closing_prayer_id ? ({ id: data.closing_prayer_id } as any) : null;
            }
            if (data.aux_counselor_1_id !== undefined) {
                schedule.aux_counselor_1_id = data.aux_counselor_1_id;
                schedule.auxCounselor1 = data.aux_counselor_1_id ? ({ id: data.aux_counselor_1_id } as any) : null;
            }
            if (data.aux_counselor_2_id !== undefined) {
                schedule.aux_counselor_2_id = data.aux_counselor_2_id;
                schedule.auxCounselor2 = data.aux_counselor_2_id ? ({ id: data.aux_counselor_2_id } as any) : null;
            }
            if (data.cbs_conductor_id !== undefined) {
                schedule.cbs_conductor_id = data.cbs_conductor_id;
                schedule.cbsConductor = data.cbs_conductor_id ? ({ id: data.cbs_conductor_id } as any) : null;
            }
            if (data.cbs_reader_id !== undefined) {
                schedule.cbs_reader_id = data.cbs_reader_id;
                schedule.cbsReader = data.cbs_reader_id ? ({ id: data.cbs_reader_id } as any) : null;
            }
        }

        await midweekScheduleRepository.save(schedule);
        return this.getScheduleById(scheduleId, congregationId);
    }

    async updatePart(partId: string, congregationId: string, data: Partial<MidweekMeetingPart>): Promise<MidweekMeetingPart> {
        const part = await midweekMeetingPartRepository.findOne({
            where: { id: partId },
            relations: ["schedule"]
        });

        if (!part || part.schedule.congregation_id !== congregationId) {
            throw new Error("Parte da reunião não encontrada.");
        }

        if (data.assigned_publisher_id !== undefined) part.assigned_publisher_id = data.assigned_publisher_id;
        if (data.assistant_publisher_id !== undefined) part.assistant_publisher_id = data.assistant_publisher_id;
        if (data.room !== undefined) part.room = data.room;
        if (data.title !== undefined) part.title = data.title;
        if (data.sourceMaterial !== undefined) part.sourceMaterial = data.sourceMaterial;
        if (data.timeMinutes !== undefined) part.timeMinutes = data.timeMinutes;
        if (data.lessonNumber !== undefined) part.lessonNumber = data.lessonNumber;
        if (data.studyPoint !== undefined) part.studyPoint = data.studyPoint;
        if (data.studyPointDescription !== undefined) part.studyPointDescription = data.studyPointDescription;
        if (data.brochure !== undefined) part.brochure = data.brochure;
        if (data.requiresAssistant !== undefined) part.requiresAssistant = data.requiresAssistant;
        if (data.method !== undefined) part.method = data.method;
        if (data.isActive !== undefined) part.isActive = data.isActive;
        if (data.isCompleted !== undefined) part.isCompleted = data.isCompleted;
        if (data.orderIndex !== undefined) part.orderIndex = data.orderIndex;

        await midweekMeetingPartRepository.save(part);

        const updatedPart = await midweekMeetingPartRepository.findOne({
            where: { id: partId },
            relations: ["assignedPublisher", "assistantPublisher"]
        });

        return updatedPart!;
    }

    async createCustomPart(scheduleId: string, congregationId: string, partData: Partial<MidweekMeetingPart>): Promise<MidweekMeetingPart> {
        const schedule = await this.getScheduleById(scheduleId, congregationId);

        const newPart = new MidweekMeetingPart();
        newPart.schedule_id = schedule.id;
        newPart.section = partData.section || MidweekSection.LIVING;
        newPart.partType = partData.partType || MidweekPartType.CUSTOM;
        newPart.title = partData.title || "Parte Personalizada";
        newPart.sourceMaterial = partData.sourceMaterial || null;
        newPart.timeMinutes = partData.timeMinutes || 5;
        newPart.method = partData.method || "Discurso";
        newPart.room = partData.room || MidweekRoom.MAIN;
        newPart.requiresAssistant = partData.requiresAssistant || false;
        newPart.assigned_publisher_id = partData.assigned_publisher_id || null;
        newPart.assistant_publisher_id = partData.assistant_publisher_id || null;
        newPart.custom_speaker_name = partData.custom_speaker_name || null;
        newPart.orderIndex = partData.orderIndex || 99;
        newPart.isActive = true;

        return await midweekMeetingPartRepository.save(newPart);
    }

    async deletePart(partId: string, congregationId: string): Promise<void> {
        const part = await midweekMeetingPartRepository.findOne({
            where: { id: partId },
            relations: ["schedule"]
        });

        if (!part || part.schedule.congregation_id !== congregationId) {
            throw new Error("Parte não encontrada.");
        }

        await midweekMeetingPartRepository.remove(part);
    }

    async duplicateStudentPartsForRoom(scheduleId: string, congregationId: string, targetRoom: MidweekRoom): Promise<MidweekMeetingPart[]> {
        const schedule = await this.getScheduleById(scheduleId, congregationId);

        const mainStudentParts = schedule.parts.filter(
            p => (p.section === MidweekSection.MINISTRY || p.partType === MidweekPartType.BIBLE_READING) &&
                 p.room === MidweekRoom.MAIN
        );

        const createdParts: MidweekMeetingPart[] = [];

        for (const mainPart of mainStudentParts) {
            const exists = schedule.parts.some(
                p => p.room === targetRoom && p.orderIndex === mainPart.orderIndex && p.title === mainPart.title
            );

            if (!exists) {
                const roomPart = new MidweekMeetingPart();
                roomPart.schedule_id = schedule.id;
                roomPart.workbook_part_id = mainPart.workbook_part_id;
                roomPart.section = mainPart.section;
                roomPart.partType = mainPart.partType;
                roomPart.title = mainPart.title;
                roomPart.sourceMaterial = mainPart.sourceMaterial;
                roomPart.timeMinutes = mainPart.timeMinutes;
                roomPart.lessonNumber = mainPart.lessonNumber;
                roomPart.studyPoint = mainPart.studyPoint;
                roomPart.studyPointDescription = mainPart.studyPointDescription;
                roomPart.brochure = mainPart.brochure;
                roomPart.requiresAssistant = mainPart.requiresAssistant;
                roomPart.method = mainPart.method;
                roomPart.prompts = mainPart.prompts;
                roomPart.room = targetRoom;
                roomPart.orderIndex = mainPart.orderIndex;
                roomPart.isActive = true;

                createdParts.push(roomPart);
            }
        }

        if (createdParts.length > 0) {
            return await midweekMeetingPartRepository.save(createdParts);
        }

        return [];
    }
}
