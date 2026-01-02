import { Response } from "express"
import dayjs from "dayjs"
import { NotFoundError, BadRequestError } from "../../helpers/api-errors"
import { publicWitnessArrangementRepository } from "../../repositories/publicWitnessArrangementRepository"
import { publicWitnessAssignmentRepository } from "../../repositories/publicWitnessAssignmentRepository"
import { publicWitnessAssignmentPublisherRepository } from "../../repositories/publicWitnessAssignmentPublisherRepository"
import { publisherRepository } from "../../repositories/publisherRepository"
import { CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest"
import { BodyScheduleCreateMultiple, ParamsSchedule } from "./types"
import { publicWitnessTimeSlotDefaultPublisherRepository } from "../../repositories/publicWitnessTimeSlotDefaultPublisherRepository"
import { Between } from "typeorm"
import { ParamsCongregation } from "../PublicWitnessArrangementController/types"

class PublicWitnessScheduleController {
    async createMultiple(
        req: CustomRequestPT<ParamsSchedule, BodyScheduleCreateMultiple>,
        res: Response
    ) {
        const { schedule } = req.body
        const { arrangement_id } = req.params

        // Buscar arranjo com slots
        const arrangement = await publicWitnessArrangementRepository.findOne({
            where: { id: arrangement_id },
            relations: ["timeSlots"]
        })
        if (!arrangement) throw new NotFoundError("Arrangement not found")

        const allCreatedAssignments = []

        for (const daySchedule of schedule) {
            const scheduleDate = dayjs(daySchedule.date)

            // Validação da data
            if (arrangement.is_fixed) {
                if (arrangement.weekday === null || scheduleDate.day() !== arrangement.weekday) {
                    throw new BadRequestError(
                        `The date ${daySchedule.date} does not match the weekday of the fixed arrangement`
                    )
                }
            } else {
                if (!arrangement.date || arrangement.date !== daySchedule.date) {
                    throw new BadRequestError(
                        `The date ${daySchedule.date} must match the specific date of the arrangement`
                    )
                }
            }

            const createdAssignments = []

            for (const slotPayload of daySchedule.slots) {
                const timeSlot = arrangement.timeSlots.find(ts => ts.id === slotPayload.time_slot_id)
                if (!timeSlot) {
                    throw new BadRequestError(`Time slot ${slotPayload.time_slot_id} does not exist in the arrangement`)
                }

                // Verificar se há publishers fixos para esse slot
                const defaultPublishers =
                    await publicWitnessTimeSlotDefaultPublisherRepository.find({
                        where: { time_slot_id: timeSlot.id },
                        relations: ["publisher"],
                        order: { order: "ASC" }
                    })


                if (defaultPublishers.length > 0) {
                    createdAssignments.push({
                        time_slot_id: timeSlot.id,
                        publishers: defaultPublishers.map(dp => ({
                            publisher_id: dp.publisher.id,
                            name: dp.publisher.fullName,
                            order: dp.order
                        })),
                        fixed: true
                    })
                    continue
                }

                if (!slotPayload.publishers || slotPayload.publishers.length === 0) {
                    throw new BadRequestError(`Slot ${slotPayload.time_slot_id} is rotative and requires publishers`)
                }

                // Verificar se já existe assignment para esta data e slot
                let assignment = await publicWitnessAssignmentRepository.findOne({
                    where: { date: daySchedule.date, time_slot_id: timeSlot.id },
                    relations: ["publishers", "publishers.publisher"]
                })

                if (!assignment) {
                    assignment = publicWitnessAssignmentRepository.create({
                        date: daySchedule.date,
                        time_slot_id: timeSlot.id,
                        timeSlot: timeSlot
                    })
                    await publicWitnessAssignmentRepository.save(assignment)
                } else {
                    // Se já existe, remove publishers antigos antes de atualizar
                    if (assignment.publishers && assignment.publishers.length > 0) {
                        await publicWitnessAssignmentPublisherRepository.remove(assignment.publishers)
                    }
                }

                // Vincular publishers
                for (const pub of slotPayload.publishers) {
                    const publisher = await publisherRepository.findOneBy({ id: pub.publisher_id })
                    if (!publisher) throw new NotFoundError(`Publisher ${pub.publisher_id} not found`)

                    const assignmentPublisher = publicWitnessAssignmentPublisherRepository.create({
                        assignment_id: assignment.id,
                        publisher_id: publisher.id,
                        order: pub.order ?? 0
                    })
                    await publicWitnessAssignmentPublisherRepository.save(assignmentPublisher)
                }

                const assignmentWithPublishers = await publicWitnessAssignmentRepository.findOne({
                    where: { id: assignment.id },
                    relations: ["publishers", "publishers.publisher"]
                })

                createdAssignments.push({ ...assignmentWithPublishers, fixed: false })
            }

            allCreatedAssignments.push({
                date: daySchedule.date,
                assignments: createdAssignments
            })
        }

        return res.status(201).json({
            arrangement_id: arrangement.id,
            schedule: allCreatedAssignments
        })
    }

    async getByDateRange(
        req: ParamsCustomRequest<ParamsSchedule>,
        res: Response
    ) {
        const { arrangement_id } = req.params
        const { start_date, end_date } = req.query

        if (!start_date || !end_date) {
            throw new BadRequestError("start_date and end_date are required")
        }

        const start = dayjs(start_date.toString())
        const end = dayjs(end_date.toString())

        if (!start.isValid() || !end.isValid()) {
            throw new BadRequestError("Invalid date format. Use YYYY-MM-DD")
        }

        if (end.isBefore(start)) {
            throw new BadRequestError("end_date must be after start_date")
        }

        const arrangement = await publicWitnessArrangementRepository.findOne({
            where: { id: arrangement_id }
        })

        if (!arrangement) {
            throw new NotFoundError("Arrangement not found")
        }

        const assignments = await publicWitnessAssignmentRepository.find({
            where: {
                timeSlot: {
                    arrangement_id
                },
                date: Between(
                    start.format("YYYY-MM-DD"),
                    end.format("YYYY-MM-DD")
                )
            },
            relations: [
                "publishers",
                "publishers.publisher",
                "timeSlot"
            ],
            order: {
                date: "ASC",
                publishers: {
                    order: "ASC"
                }
            }
        })

        // 🔁 Agrupar por data
        const scheduleMap: Record<string, any[]> = {}

        for (const assignment of assignments) {
            if (!scheduleMap[assignment.date]) {
                scheduleMap[assignment.date] = []
            }

            scheduleMap[assignment.date].push({
                id: assignment.id,
                time_slot_id: assignment.time_slot_id,
                date: assignment.date,
                created_at: assignment.created_at,
                fixed: false,
                publishers: assignment.publishers
            })
        }

        const schedule = Object.entries(scheduleMap).map(
            ([date, assignments]) => ({
                date,
                assignments
            })
        )

        return res.json({
            arrangement_id,
            start_date,
            end_date,
            schedule
        })
    }

    // =========================
    // Rota para retornar schedule (fixos + rodízio)
    // =========================
    async getPublicWitnessScheduleByCongregation(
        req: ParamsCustomRequest<ParamsCongregation>,
        res: Response
    ) {
        const { congregation_id } = req.params

        const arrangements = await publicWitnessArrangementRepository.find({
            where: { congregation_id },
            relations: [
                "timeSlots",
                "timeSlots.defaultPublishers",
                "timeSlots.defaultPublishers.publisher"
            ]
        })

        const today = dayjs().format("YYYY-MM-DD")

        const fixedSchedules: any[] = []
        const rotationBlocks: any[] = []

        for (const arr of arrangements) {
            for (const slot of arr.timeSlots) {

                /* ================= FIXOS ================= */
                if (!slot.is_rotative) {
                    fixedSchedules.push({
                        date: arr.is_fixed ? null : arr.date,
                        weekday: arr.is_fixed ? arr.weekday : null,
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                        title: arr.title,
                        publishers: slot.defaultPublishers.map(dp => ({
                            id: dp.publisher.id,
                            name: dp.publisher.nickname ? dp.publisher.nickname : dp.publisher.fullName ?? "-"
                        }))
                    })

                    continue
                }

                /* ================= RODÍZIO ================= */
                const assignments = await publicWitnessAssignmentRepository.find({
                    where: {
                        time_slot_id: slot.id,
                        date: Between(today, "9999-12-31")
                    },
                    relations: ["publishers", "publishers.publisher"],
                    order: {
                        date: "ASC",
                        publishers: { order: "ASC" }
                    }
                })

                if (!assignments.length) continue

                rotationBlocks.push({
                    title: arr.title,
                    weekday: arr.weekday,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    schedules: assignments.map(a => ({
                        date: a.date,
                        publishers: a.publishers.map(p => ({
                            id: p.publisher.id,
                            name: p.publisher.nickname ? p.publisher.nickname : p.publisher.fullName ?? "-"
                        }))
                    }))
                })
            }
        }

        return res.json({ fixedSchedules, rotationBlocks })
    }

    async getPdfByCongregation(
        req: ParamsCustomRequest<ParamsCongregation>,
        res: Response
    ) {
        const { congregation_id } = req.params
        const { start, end } = req.query

        if (!start || !end) {
            throw new BadRequestError("start and end are required")
        }

        const startDate = dayjs(start.toString())
        const endDate = dayjs(end.toString())

        if (!startDate.isValid() || !endDate.isValid()) {
            throw new BadRequestError("Invalid date format. Use YYYY-MM-DD")
        }

        if (endDate.isBefore(startDate)) {
            throw new BadRequestError("end must be after start")
        }

        const arrangements = await publicWitnessArrangementRepository.find({
            where: { congregation_id },
            relations: [
                "timeSlots",
                "timeSlots.defaultPublishers",
                "timeSlots.defaultPublishers.publisher"
            ]
        })

        const fixedSchedules: any[] = []
        const rotationBlocksMap = new Map<string, any>()

        for (const arr of arrangements) {
            for (const slot of arr.timeSlots) {

                /* ================= FIXOS ================= */
                if (!slot.is_rotative) {
                    fixedSchedules.push({
                        title: arr.title,
                        date: arr.is_fixed ? null : arr.date,
                        weekday: arr.is_fixed ? arr.weekday : null,
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                        publishers: slot.defaultPublishers.map(dp => ({
                            id: dp.publisher.id,
                            name: dp.publisher.nickname ?? dp.publisher.fullName ?? "-"
                        }))
                    })
                    continue
                }

                /* ================= RODÍZIO ================= */
                const assignments = await publicWitnessAssignmentRepository.find({
                    where: {
                        time_slot_id: slot.id,
                        date: Between(
                            startDate.format("YYYY-MM-DD"),
                            endDate.format("YYYY-MM-DD")
                        )
                    },
                    relations: ["publishers", "publishers.publisher"],
                    order: {
                        date: "ASC",
                        publishers: { order: "ASC" }
                    }
                })

                if (!assignments.length) continue

                // 🔑 AGRUPA POR ARRANJO (não por horário)
                const blockKey = `${arr.id}`

                if (!rotationBlocksMap.has(blockKey)) {
                    rotationBlocksMap.set(blockKey, {
                        title: arr.title,
                        weekday: arr.weekday,
                        schedules: []
                    })
                }

                const block = rotationBlocksMap.get(blockKey)

                for (const a of assignments) {
                    // 🔹 Agrupa por data
                    let day = block.schedules.find(
                        (s: any) => s.date === a.date
                    )

                    if (!day) {
                        day = {
                            date: a.date,
                            slots: []
                        }
                        block.schedules.push(day)
                    }

                    // 🔹 Agrupa horários dentro da data
                    day.slots.push({
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                        publishers: a.publishers.map(p => ({
                            id: p.publisher.id,
                            name: p.publisher.nickname ?? p.publisher.fullName ?? "-"
                        }))
                    })
                }
            }
        }

        return res.json({
            fixedSchedules,
            rotationBlocks: Array.from(rotationBlocksMap.values())
        })
    }

}

export default new PublicWitnessScheduleController()
