import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { Request, Response } from "express";
import { Between, MoreThanOrEqual } from "typeorm";
import { MidweekMeetingPart } from "../../entities/MidweekMeetingPart";
import { MidweekSpecialType } from "../../entities/MidweekSchedule";
import { EventImpactScope, SpecialEvent, SpecialEventType } from "../../entities/SpecialEvent";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { congregationRepository } from "../../repositories/congregationRepository";
import { midweekMeetingPartRepository } from "../../repositories/midweekMeetingPartRepository";
import { midweekScheduleRepository } from "../../repositories/midweekScheduleRepository";
import { specialEventRepository } from "../../repositories/specialEventRepository";
import { weekendScheduleRepository } from "../../repositories/weekendScheduleRepository";

dayjs.extend(isoWeek);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export function mapSpecialEventTypeToMidweek(type: SpecialEventType): MidweekSpecialType {
    switch (type) {
        case SpecialEventType.CIRCUIT_ASSEMBLY:
            return MidweekSpecialType.CIRCUIT_ASSEMBLY;
        case SpecialEventType.REGIONAL_CONVENTION:
            return MidweekSpecialType.REGIONAL_CONVENTION;
        case SpecialEventType.MEMORIAL:
            return MidweekSpecialType.MEMORIAL;
        case SpecialEventType.CIRCUIT_OVERSEER_VISIT:
            return MidweekSpecialType.CIRCUIT_OVERSEER_VISIT;
        case SpecialEventType.SPECIAL_TALK:
            return MidweekSpecialType.SPECIAL_TALK;
        default:
            return MidweekSpecialType.CUSTOM;
    }
}

class SpecialEventController {
    /**
     * Lista eventos especiais da congregação (com filtros opcionais)
     */
    async list(req: Request, res: Response) {
        const { congregation_id } = req.params;
        const { futureOnly, year } = req.query;

        const whereClause: any = {
            congregation: { id: congregation_id }
        };

        if (futureOnly === "true") {
            const today = dayjs().format("YYYY-MM-DD");
            whereClause.endDate = MoreThanOrEqual(today);
        } else if (year) {
            const startOfYear = `${year}-01-01`;
            const endOfYear = `${year}-12-31`;
            whereClause.startDate = Between(startOfYear, endOfYear);
        }

        const events = await specialEventRepository.find({
            where: whereClause,
            order: {
                startDate: futureOnly === "true" ? "ASC" : "DESC"
            }
        });

        // Garante sincronização de eventos ativos
        for (const evt of events) {
            await syncEventImpacts(evt);
        }

        return res.status(200).json(events);
    }

    /**
     * Lista pública de eventos especiais por ID da congregação (para o Quadro de Anúncios)
     */
    async getPublicEvents(req: Request, res: Response) {
        const { congregation_id } = req.params;
        const recentDate = dayjs().subtract(7, "day").format("YYYY-MM-DD");

        const events = await specialEventRepository.find({
            where: {
                congregation: { id: congregation_id },
                showOnPublicBoard: true,
                endDate: MoreThanOrEqual(recentDate)
            },
            order: {
                startDate: "ASC"
            }
        });

        return res.status(200).json(events);
    }

    /**
     * Lista pública de eventos especiais por número da congregação
     */
    async getPublicEventsByNumber(req: Request, res: Response) {
        const { number } = req.params;

        const congregation = await congregationRepository.findOne({
            where: { number }
        });

        if (!congregation) {
            throw new NotFoundError("Congregação não encontrada.");
        }

        const recentDate = dayjs().subtract(7, "day").format("YYYY-MM-DD");

        const events = await specialEventRepository.find({
            where: {
                congregation: { id: congregation.id },
                showOnPublicBoard: true,
                endDate: MoreThanOrEqual(recentDate)
            },
            order: {
                startDate: "ASC"
            }
        });

        return res.status(200).json(events);
    }

    /**
     * Cria um novo evento especial e sincroniza automaticamente com as programações
     */
    async create(req: Request, res: Response) {
        const { congregation_id } = req.params;
        const {
            type,
            title,
            startDate,
            endDate,
            affectsWholeWeek,
            cancelMidweekMeeting,
            cancelWeekendMeeting,
            isCircuitOverseerVisit,
            cancelCleaning,
            fieldServiceImpact,
            publicWitnessingImpact,
            showOnPublicBoard,
            theme,
            location,
            notes
        } = req.body;

        if (!title || !startDate || !endDate || !type) {
            throw new BadRequestError("Título, tipo, data de início e data de fim são obrigatórios.");
        }

        const start = dayjs(startDate);
        const end = dayjs(endDate);

        if (!start.isValid() || !end.isValid()) {
            throw new BadRequestError("Formato de data inválido. Use YYYY-MM-DD.");
        }

        if (end.isBefore(start)) {
            throw new BadRequestError("A data de término não pode ser anterior à data de início.");
        }

        const congregation = await congregationRepository.findOne({
            where: { id: congregation_id }
        });

        if (!congregation) {
            throw new NotFoundError("Congregação não encontrada.");
        }

        const newEvent = specialEventRepository.create({
            congregation: { id: congregation_id },
            congregation_id,
            type: type as SpecialEventType,
            title: title.trim(),
            startDate: start.format("YYYY-MM-DD"),
            endDate: end.format("YYYY-MM-DD"),
            affectsWholeWeek: affectsWholeWeek ?? true,
            cancelMidweekMeeting: cancelMidweekMeeting ?? false,
            cancelWeekendMeeting: cancelWeekendMeeting ?? false,
            isCircuitOverseerVisit: isCircuitOverseerVisit ?? (type === SpecialEventType.CIRCUIT_OVERSEER_VISIT),
            cancelCleaning: cancelCleaning ?? false,
            fieldServiceImpact: fieldServiceImpact ?? EventImpactScope.NONE,
            publicWitnessingImpact: publicWitnessingImpact ?? EventImpactScope.NONE,
            showOnPublicBoard: showOnPublicBoard ?? true,
            theme: theme?.trim() || null,
            location: location?.trim() || null,
            notes: notes?.trim() || null
        });

        const savedEvent = await specialEventRepository.save(newEvent);

        // Sincroniza impactos automáticos
        await syncEventImpacts(savedEvent);

        return res.status(201).json(savedEvent);
    }

    /**
     * Atualiza um evento especial e re-sincroniza os impactos
     */
    async update(req: Request, res: Response) {
        const { id } = req.params;
        const event = await specialEventRepository.findOne({
            where: { id },
            relations: ["congregation"]
        });

        if (!event) {
            throw new NotFoundError("Evento especial não encontrado.");
        }

        const {
            type,
            title,
            startDate,
            endDate,
            affectsWholeWeek,
            cancelMidweekMeeting,
            cancelWeekendMeeting,
            isCircuitOverseerVisit,
            cancelCleaning,
            fieldServiceImpact,
            publicWitnessingImpact,
            showOnPublicBoard,
            theme,
            location,
            notes
        } = req.body;

        if (title !== undefined) event.title = title.trim();
        if (type !== undefined) event.type = type;
        if (startDate !== undefined) event.startDate = dayjs(startDate).format("YYYY-MM-DD");
        if (endDate !== undefined) event.endDate = dayjs(endDate).format("YYYY-MM-DD");
        if (affectsWholeWeek !== undefined) event.affectsWholeWeek = affectsWholeWeek;
        if (cancelMidweekMeeting !== undefined) event.cancelMidweekMeeting = cancelMidweekMeeting;
        if (cancelWeekendMeeting !== undefined) event.cancelWeekendMeeting = cancelWeekendMeeting;
        if (isCircuitOverseerVisit !== undefined) event.isCircuitOverseerVisit = isCircuitOverseerVisit;
        if (cancelCleaning !== undefined) event.cancelCleaning = cancelCleaning;
        if (fieldServiceImpact !== undefined) event.fieldServiceImpact = fieldServiceImpact;
        if (publicWitnessingImpact !== undefined) event.publicWitnessingImpact = publicWitnessingImpact;
        if (showOnPublicBoard !== undefined) event.showOnPublicBoard = showOnPublicBoard;
        if (theme !== undefined) event.theme = theme?.trim() || null;
        if (location !== undefined) event.location = location?.trim() || null;
        if (notes !== undefined) event.notes = notes?.trim() || null;

        const updatedEvent = await specialEventRepository.save(event);

        // Re-sincroniza
        await syncEventImpacts(updatedEvent);

        return res.status(200).json(updatedEvent);
    }

    /**
     * Exclui o evento especial e reverte status de reuniões caso tenham sido marcadas
     */
    async delete(req: Request, res: Response) {
        const { id } = req.params;
        const event = await specialEventRepository.findOne({
            where: { id },
            relations: ["congregation"]
        });

        if (!event) {
            throw new NotFoundError("Evento especial não encontrado.");
        }

        // Reverte marcação em MidweekSchedules que tinham o nome deste evento
        const startWeek = dayjs(event.startDate).startOf("isoWeek").format("YYYY-MM-DD");
        const endWeek = dayjs(event.endDate).endOf("isoWeek").format("YYYY-MM-DD");

        const midweekSchedules = await midweekScheduleRepository.find({
            where: {
                congregation: { id: event.congregation_id },
                weekDate: Between(startWeek, endWeek)
            }
        });

        for (const schedule of midweekSchedules) {
            if (schedule.specialName === event.title) {
                schedule.isSpecial = false;
                schedule.specialType = MidweekSpecialType.NONE;
                schedule.specialName = null;
                await midweekScheduleRepository.save(schedule);
            }
        }

        // Reverte marcação em WeekendSchedules que tinham o nome deste evento
        const congregation = await congregationRepository.findOne({
            where: { id: event.congregation_id }
        });

        const affectedDates = getAffectedWeekendDates(
            event.startDate,
            event.endDate,
            event.affectsWholeWeek,
            congregation?.dayMeetingPublic
        );

        for (const date of affectedDates) {
            const ws = await weekendScheduleRepository.findOne({
                where: {
                    congregation: { id: event.congregation_id },
                    date
                }
            });
            if (ws && ws.specialName === event.title) {
                ws.isSpecial = false;
                ws.specialName = null;
                await weekendScheduleRepository.save(ws);
            }
        }

        await specialEventRepository.delete(id);

        return res.status(204).send();
    }
}

/**
 * Retorna as datas de fim de semana (Sábado/Domingo ou dia de reunião) afetadas por um evento
 */
export function getAffectedWeekendDates(
    startDate: string,
    endDate: string,
    affectsWholeWeek: boolean,
    dayMeetingPublic?: string | null
): string[] {
    const dates: string[] = [];
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    const rangeStart = affectsWholeWeek ? start.startOf("isoWeek") : start;
    const rangeEnd = affectsWholeWeek ? end.endOf("isoWeek") : end;

    let targetWeekdays: number[] = [6, 7]; // Padrão: Sábado e Domingo
    if (dayMeetingPublic === "Sábado" || dayMeetingPublic === "Sabado") {
        targetWeekdays = [6];
    } else if (dayMeetingPublic === "Domingo") {
        targetWeekdays = [7];
    } else if (dayMeetingPublic === "Sexta-feira" || dayMeetingPublic === "Sexta") {
        targetWeekdays = [5];
    }

    let cur = rangeStart.clone();
    while (cur.isSameOrBefore(rangeEnd, "day")) {
        const isoWeekday = cur.isoWeekday();
        if (targetWeekdays.includes(isoWeekday)) {
            if (affectsWholeWeek || (cur.isSameOrAfter(start, "day") && cur.isSameOrBefore(end, "day"))) {
                dates.push(cur.format("YYYY-MM-DD"));
            }
        }
        cur = cur.add(1, "day");
    }

    // Se o evento caiu no fim de semana mas targetWeekdays não capturou por incompatibilidade:
    if (dates.length === 0 && (start.isoWeekday() === 6 || start.isoWeekday() === 7)) {
        dates.push(start.format("YYYY-MM-DD"));
    }

    return dates;
}

/**
 * Propaga os impactos do evento para as programações de Reunião de Meio e Fim de Semana
 */
export async function syncEventImpacts(event: SpecialEvent) {
    const startWeek = dayjs(event.startDate).startOf("isoWeek").format("YYYY-MM-DD");
    const endWeek = dayjs(event.endDate).endOf("isoWeek").format("YYYY-MM-DD");

    const congregation = await congregationRepository.findOne({
        where: { id: event.congregation_id }
    });

    // 1. Sincroniza Reunião de Meio de Semana
    if (event.cancelMidweekMeeting || event.isCircuitOverseerVisit) {
        const schedules = await midweekScheduleRepository.find({
            where: {
                congregation: { id: event.congregation_id },
                weekDate: Between(startWeek, endWeek)
            },
            relations: ["parts"]
        });

        for (const schedule of schedules) {
            schedule.isSpecial = true;
            schedule.specialName = event.title;

            if (event.cancelMidweekMeeting) {
                schedule.specialType = mapSpecialEventTypeToMidweek(event.type);
                // Limpa participantes se não for visita de superintendente
                if (schedule.specialType !== MidweekSpecialType.CIRCUIT_OVERSEER_VISIT) {
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

                    await midweekMeetingPartRepository
                        .createQueryBuilder()
                        .update(MidweekMeetingPart)
                        .set({
                            assigned_publisher_id: null,
                            assistant_publisher_id: null
                        })
                        .where("schedule_id = :id", { id: schedule.id })
                        .execute();
                }
            } else if (event.isCircuitOverseerVisit) {
                schedule.specialType = MidweekSpecialType.CIRCUIT_OVERSEER_VISIT;
            }

            await midweekScheduleRepository.save(schedule);
        }
    }

    // 2. Sincroniza Reunião de Fim de Semana
    const affectedWeekendDates = getAffectedWeekendDates(
        event.startDate,
        event.endDate,
        event.affectsWholeWeek,
        congregation?.dayMeetingPublic
    );

    for (const date of affectedWeekendDates) {
        let ws = await weekendScheduleRepository.findOne({
            where: {
                congregation: { id: event.congregation_id },
                date
            },
            relations: ["speaker", "talk", "chairman", "reader", "visitingCongregation"]
        });

        if (ws) {
            ws.isSpecial = true;
            if (!ws.specialName) ws.specialName = event.title;
            if (event.cancelWeekendMeeting) {
                ws.speaker = null;
                ws.talk = null;
                ws.chairman = null;
                ws.reader = null;
                ws.visitingCongregation = null;
                ws.manualSpeaker = null;
                ws.manualTalk = null;
            }
            await weekendScheduleRepository.save(ws);
        } else {
            ws = weekendScheduleRepository.create({
                congregation: { id: event.congregation_id },
                date,
                isSpecial: true,
                specialName: event.title,
                watchTowerStudyTitle: null,
                chairman: null,
                reader: null,
                speaker: null,
                talk: null,
                manualSpeaker: null,
                manualTalk: null
            });
            await weekendScheduleRepository.save(ws);
        }
    }
}

export default new SpecialEventController();
