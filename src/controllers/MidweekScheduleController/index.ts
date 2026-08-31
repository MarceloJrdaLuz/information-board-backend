import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { Request, Response } from "express";
import { MidweekRoom } from "../../entities/MidweekMeetingPart";
import { BadRequestError } from "../../helpers/api-errors";
import { publisherMidweekQualificationRepository } from "../../repositories/publisherMidweekQualificationRepository";
import { publisherUnavailabilityRepository } from "../../repositories/publisherUnavailabilityRepository";
import { MidweekAutoAssignService } from "../../services/midweek/MidweekAutoAssignService";
import { MidweekScheduleService } from "../../services/midweek/MidweekScheduleService";
import { MidweekSuggestionService } from "../../services/midweek/MidweekSuggestionService";
import { MidweekXmlParserService } from "../../services/midweek/MidweekXmlParserService";

export class MidweekScheduleController {
    private scheduleService: MidweekScheduleService;
    private suggestionService: MidweekSuggestionService;
    private autoAssignService: MidweekAutoAssignService;
    private xmlParserService: MidweekXmlParserService;

    constructor() {
        this.scheduleService = new MidweekScheduleService();
        this.suggestionService = new MidweekSuggestionService();
        this.autoAssignService = new MidweekAutoAssignService();
        this.xmlParserService = new MidweekXmlParserService();
    }

    async importXml(req: Request, res: Response) {
        if (!req.file) {
            throw new BadRequestError("Arquivo XML não enviado.");
        }

        const xmlContent = req.file.buffer.toString("utf-8");
        const result = await this.xmlParserService.parseAndSaveWorkbook(xmlContent);

        return res.status(200).json(result);
    }

    async getMonthSchedules(req: Request, res: Response) {
        const { congregation_id } = req.params;
        const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();
        const month = parseInt(req.query.month as string, 10) || (new Date().getMonth() + 1);

        const schedules = await this.scheduleService.getOrGenerateMonthSchedules(congregation_id, year, month);
        return res.status(200).json(schedules);
    }

    async getScheduleById(req: Request, res: Response) {
        const { congregation_id, schedule_id } = req.params;
        const schedule = await this.scheduleService.getScheduleById(schedule_id, congregation_id);
        return res.status(200).json(schedule);
    }

    async updateSchedule(req: Request, res: Response) {
        const { congregation_id, schedule_id } = req.params;
        const updated = await this.scheduleService.updateSchedule(schedule_id, congregation_id, req.body);
        return res.status(200).json(updated);
    }

    async updatePart(req: Request, res: Response) {
        const { congregation_id, part_id } = req.params;
        const updated = await this.scheduleService.updatePart(part_id, congregation_id, req.body);
        return res.status(200).json(updated);
    }

    async createCustomPart(req: Request, res: Response) {
        const { congregation_id, schedule_id } = req.params;
        const created = await this.scheduleService.createCustomPart(schedule_id, congregation_id, req.body);
        return res.status(201).json(created);
    }

    async deletePart(req: Request, res: Response) {
        const { congregation_id, part_id } = req.params;
        await this.scheduleService.deletePart(part_id, congregation_id);
        return res.status(204).send();
    }

    async duplicateStudentPartsForRoom(req: Request, res: Response) {
        const { congregation_id, schedule_id, room } = req.params;
        const targetRoom = (room || req.body.targetRoom) as MidweekRoom;

        if (!targetRoom || (targetRoom !== MidweekRoom.AUXILIARY_1 && targetRoom !== MidweekRoom.AUXILIARY_2)) {
            throw new BadRequestError("targetRoom inválido. Deve ser AUXILIARY_1 ou AUXILIARY_2.");
        }

        await this.scheduleService.duplicateStudentPartsForRoom(schedule_id, congregation_id, targetRoom);
        const updatedSchedule = await this.scheduleService.getScheduleById(schedule_id, congregation_id);
        return res.status(200).json(updatedSchedule);
    }

    async getSuggestionsForPart(req: Request, res: Response) {
        const { congregation_id, part_id } = req.params;
        const isForAssistant = req.query.isAssistant === "true";

        const suggestions = await this.suggestionService.getSuggestionsForPart(part_id, congregation_id, isForAssistant);
        return res.status(200).json(suggestions);
    }

    async getSuggestionsForRole(req: Request, res: Response) {
        const { congregation_id, schedule_id } = req.params;
        const role = req.query.role as "CHAIRMAN" | "OPENING_PRAYER" | "CLOSING_PRAYER" | "AUX_COUNSELOR" | "CBS_CONDUCTOR" | "CBS_READER";

        if (!role) {
            throw new BadRequestError("Parâmetro 'role' é obrigatório.");
        }

        const suggestions = await this.suggestionService.getSuggestionsForRole(role, schedule_id, congregation_id);
        return res.status(200).json(suggestions);
    }

    async autoAssignSchedule(req: Request, res: Response) {
        const { congregation_id, schedule_id } = req.params;
        const updated = await this.autoAssignService.autoAssignSchedule(schedule_id, congregation_id);
        return res.status(200).json(updated);
    }

    async autoAssignMonth(req: Request, res: Response) {
        const { congregation_id } = req.params;
        const year = parseInt(req.body.year as string, 10) || new Date().getFullYear();
        const month = parseInt(req.body.month as string, 10) || (new Date().getMonth() + 1);

        const updated = await this.autoAssignService.autoAssignMonth(congregation_id, year, month);
        return res.status(200).json(updated);
    }

    async getPublisherQualification(req: Request, res: Response) {
        const { publisher_id } = req.params;

        let qual = await publisherMidweekQualificationRepository.findOne({
            where: { publisher_id }
        });

        if (!qual) {
            qual = publisherMidweekQualificationRepository.create({
                publisher_id
            });
            await publisherMidweekQualificationRepository.save(qual);
        }

        return res.status(200).json(qual);
    }

    async updatePublisherQualification(req: Request, res: Response) {
        const { publisher_id } = req.params;

        let qual = await publisherMidweekQualificationRepository.findOne({
            where: { publisher_id }
        });

        if (!qual) {
            qual = publisherMidweekQualificationRepository.create({
                publisher_id
            });
        }

        Object.assign(qual, req.body);
        const saved = await publisherMidweekQualificationRepository.save(qual);
        return res.status(200).json(saved);
    }

    async getUnavailabilities(req: Request, res: Response) {
        const { congregation_id } = req.params;
        const list = await publisherUnavailabilityRepository.find({
            where: {
                publisher: {
                    congregation: {
                        id: congregation_id
                    }
                }
            },
            relations: ["publisher", "publisher.congregation"],
            order: { startDate: "ASC" }
        });

        return res.status(200).json(list);
    }

    async createUnavailability(req: Request, res: Response) {
        const unavailability = publisherUnavailabilityRepository.create(req.body);
        const saved = await publisherUnavailabilityRepository.save(unavailability);
        return res.status(201).json(saved);
    }

    async deleteUnavailability(req: Request, res: Response) {
        const { id } = req.params;
        await publisherUnavailabilityRepository.delete(id);
        return res.status(204).send();
    }

    async getPublicSchedules(req: Request, res: Response) {
        const { congregation_id } = req.params;
        const now = dayjs();
        const currentYear = now.year();
        const currentMonth = now.month() + 1;

        // Busca o mês atual e o próximo mês
        const [currentMonthSchedules, nextMonthSchedules] = await Promise.all([
            this.scheduleService.getOrGenerateMonthSchedules(congregation_id, currentYear, currentMonth),
            this.scheduleService.getOrGenerateMonthSchedules(
                congregation_id,
                currentMonth === 12 ? currentYear + 1 : currentYear,
                currentMonth === 12 ? 1 : currentMonth + 1
            )
        ]);

        const allSchedules = [...currentMonthSchedules, ...nextMonthSchedules];
        const uniqueMap = new Map<string, any>();
        allSchedules.forEach(s => {
            if (!uniqueMap.has(s.weekDate)) {
                uniqueMap.set(s.weekDate, s);
            }
        });

        const sorted = Array.from(uniqueMap.values()).sort((a, b) => a.weekDate.localeCompare(b.weekDate));

        const getDisplayName = (pub: any) => {
            if (!pub) return null;
            return pub.nickname?.trim() || pub.fullName || null;
        };

        const mapped = sorted.map(s => {
            const dateObj = dayjs(s.meetingDate || s.weekDate);
            const monthName = dateObj.locale("pt-br").format("MMMM");
            const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
            const cbsPart = (s.parts || []).find((p: any) => p.partType === "CBS" || p.title?.toLowerCase().includes("estudo bíblico"));

            return {
                id: s.id,
                weekDate: s.weekDate,
                meetingDate: s.meetingDate,
                month: capitalizedMonth,
                year: dateObj.year(),
                weeklyBibleReading: s.weeklyBibleReading,
                songOpen: s.songOpen,
                songMiddle: s.songMiddle,
                songEnd: s.songEnd,
                isSpecial: Boolean(s.isSpecial),
                specialType: s.specialType,
                specialName: s.specialName,
                notes: s.notes || null,
                isCurrentWeek: dayjs().isSame(dateObj, "week") || dayjs().isSame(dayjs(s.weekDate), "week"),
                chairman: getDisplayName(s.chairman),
                openingPrayer: getDisplayName(s.openingPrayer),
                closingPrayer: getDisplayName(s.closingPrayer),
                auxCounselor1: getDisplayName(s.auxCounselor1),
                auxCounselor2: getDisplayName(s.auxCounselor2),
                cbsConductor: getDisplayName(s.cbsConductor),
                cbsReader: getDisplayName(s.cbsReader),
                cbsSourceMaterial: cbsPart?.sourceMaterial || null,
                parts: (s.parts || [])
                    .filter((p: any) => p.isActive !== false && p.partType !== "CBS" && !p.title?.toLowerCase().includes("estudo bíblico"))
                    .sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                    .map((p: any) => ({
                        id: p.id,
                        title: p.title,
                        sourceMaterial: p.sourceMaterial,
                        timeMinutes: p.timeMinutes,
                        section: p.section,
                        partType: p.partType,
                        room: p.room,
                        orderIndex: p.orderIndex,
                        requiresAssistant: p.requiresAssistant,
                        assignedPublisher: getDisplayName(p.assignedPublisher),
                        assistantPublisher: getDisplayName(p.assistantPublisher),
                        customSpeakerName: p.custom_speaker_name,
                        lessonNumber: p.lessonNumber,
                        studyPoint: p.studyPoint,
                        studyPointDescription: p.studyPointDescription
                    }))
            };
        });

        const grouped = mapped.reduce((acc: Record<string, any[]>, item: any) => {
            const key = `${item.month} ${item.year}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});

        return res.status(200).json(grouped);
    }
}
