import dayjs from "dayjs"
import { Response } from "express-serve-static-core"
import { BadRequestError, NotFoundError } from "../../helpers/api-errors"
import { resolveReminderOccurrence } from "../../helpers/resolveReminderOccurrence"
import { publisherReminderRepository } from "../../repositories/publisherReminderRepository"
import { publisherRepository } from "../../repositories/publisherRepository"
import { CustomRequest, CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest"
import {
    BodyReminderCreateTypes,
    BodyReminderUpdateTypes,
    ParamsPublisherReminderTypes,
    ParamsReminderTypes
} from "./types"
import { RecurrenceType } from "../../entities/PublisherReminders"

class PublisherReminderController {

    /* =======================
       CREATE
    ======================= */
    async create(
        req: CustomRequestPT<ParamsPublisherReminderTypes, BodyReminderCreateTypes>,
        res: Response
    ) {
        const { publisher_id } = req.params
        const {
            title,
            description,
            startDate,
            endDate,
            isRecurring,
            recurrenceType,
            recurrenceInterval,
            recurrenceCount
        } = req.body

        if (!title) throw new BadRequestError("Title is required")
        if (!startDate) throw new BadRequestError("startDate is required")

        if (!endDate) {
            throw new BadRequestError("endDate is required")
        }

        if (dayjs(endDate).isBefore(dayjs(startDate), "day")) {
            throw new BadRequestError("endDate cannot be before startDate")
        }


        // Validação da recorrência
        if (isRecurring && !recurrenceInterval) {
            throw new BadRequestError("recurrenceInterval is required for recurring reminders")
        }

        const publisher = await publisherRepository.findOneBy({ id: publisher_id })
        if (!publisher) throw new NotFoundError("Publisher not found")

        const reminder = publisherReminderRepository.create({
            title,
            description: description ?? null,
            startDate: dayjs(startDate).format("YYYY-MM-DD"),
            endDate: endDate ? dayjs(endDate).format("YYYY-MM-DD") : null,
            isRecurring: isRecurring ?? false,
            recurrenceType: isRecurring ? (recurrenceType ?? RecurrenceType.DAILY) : RecurrenceType.DAILY,
            // Mapeia o valor para a coluna recurrenceIntervalDays no banco
            recurrenceInterval: isRecurring ? recurrenceInterval : null, recurrenceCount: isRecurring ? recurrenceCount ?? null : null,
            publisher
        })

        const saved = await publisherReminderRepository.save(reminder)
        return res.status(201).json(saved)
    }

    /* =======================
        UPDATE (UNITÁRIO)
     ======================= */
    async update(
        req: CustomRequestPT<ParamsReminderTypes, BodyReminderUpdateTypes>,
        res: Response
    ) {
        const { reminder_id } = req.params

        const reminder = await publisherReminderRepository.findOne({
            where: { id: reminder_id },
            relations: ["publisher"]
        })

        if (!reminder) throw new NotFoundError("Reminder not found")

        const {
            title,
            description,
            startDate,
            endDate,
            isRecurring,
            recurrenceType,
            recurrenceInterval,
            recurrenceCount,
            isActive
        } = req.body

        if (title !== undefined) reminder.title = title
        if (description !== undefined) reminder.description = description
        if (isActive !== undefined) reminder.isActive = isActive

        if (startDate !== undefined) {
            reminder.startDate = dayjs(startDate).format("YYYY-MM-DD")
        }

        if (endDate !== undefined) {
            const start = startDate ? dayjs(startDate) : dayjs(reminder.startDate)
            if (dayjs(endDate).isBefore(start, "day")) {
                throw new BadRequestError("endDate cannot be before startDate")
            }
            reminder.endDate = dayjs(endDate).format("YYYY-MM-DD")
        }

        // Lógica de Recorrência no Update
        if (isRecurring !== undefined) {
            reminder.isRecurring = isRecurring
            // Se o usuário desativar a recorrência, limpamos os campos auxiliares
            if (!isRecurring) {
                reminder.recurrenceInterval = null
                reminder.recurrenceCount = null
                reminder.recurrenceType = RecurrenceType.DAILY
            }
        }

        if (reminder.isRecurring) {
            if (recurrenceType !== undefined) reminder.recurrenceType = recurrenceType
            if (recurrenceInterval !== undefined) reminder.recurrenceInterval = recurrenceInterval
            if (recurrenceCount !== undefined) reminder.recurrenceCount = recurrenceCount
        }

        const saved = await publisherReminderRepository.save(reminder)
        return res.json(saved)
    }

    /* =======================
       DELETE
    ======================= */
    async delete(
        req: ParamsCustomRequest<ParamsReminderTypes>,
        res: Response
    ) {
        const { reminder_id } = req.params

        const reminder = await publisherReminderRepository.findOneBy({ id: reminder_id })
        if (!reminder) throw new NotFoundError("Reminder not found")

        await publisherReminderRepository.remove(reminder)
        return res.status(204).end()
    }

    async getOne(
        req: ParamsCustomRequest<ParamsReminderTypes>,
        res: Response
    ) {
        const { reminder_id } = req.params

        const reminder = await publisherReminderRepository.findOne({
            where: { id: reminder_id },
            relations: ["publisher"]
        })

        if (!reminder) {
            throw new NotFoundError("Reminder not found")
        }

        return res.json(reminder)
    }

    /* =======================
       GET ACTIVE (DASHBOARD)
    ======================= */
    async getActive(
        req: ParamsCustomRequest<ParamsPublisherReminderTypes>,
        res: Response
    ) {
        const { publisher_id } = req.params

        const reminders = await publisherReminderRepository.find({
            where: { publisher: { id: publisher_id }, isActive: true },
            order: { created_at: "ASC" }
        })

        const today = dayjs()

        const activeReminders = reminders
            .map(reminder => resolveReminderOccurrence(reminder, today))
            .filter(Boolean)

        return res.json(activeReminders)
    }

    /* =======================
       GET ALL (GESTÃO)
    ======================= */
    async getAll(
        req: ParamsCustomRequest<ParamsPublisherReminderTypes>,
        res: Response
    ) {
        const { publisher_id } = req.params

        const reminders = await publisherReminderRepository.find({
            where: { publisher: { id: publisher_id } },
            order: { created_at: "DESC" }
        })

        return res.json(reminders)
    }

    /* =======================
    MARCAR COMO CONCLUÍDO
 ======================= */
    async complete(
        req: ParamsCustomRequest<ParamsReminderTypes>,
        res: Response
    ) {
        const { reminder_id } = req.params

        // busca o lembrete
        const reminder = await publisherReminderRepository.findOne({
            where: { id: reminder_id }
        })

        if (!reminder) throw new NotFoundError("Reminder not found")

        const today = dayjs()

        // resolve o ciclo atual
        const currentCycle = resolveReminderOccurrence(reminder, today)

        if (!currentCycle) {
            throw new BadRequestError("No active cycle to complete for this reminder")
        }

        // marca completed_until até o fim do ciclo atual
        reminder.completed_until = currentCycle.endDate

        // salva
        await publisherReminderRepository.save(reminder)

        return res.json({
            message: "Reminder completed for the current cycle",
            completed_until: reminder.completed_until
        })
    }

}

export default new PublisherReminderController()
