"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const api_errors_1 = require("../../helpers/api-errors");
const publicWitnessArrangementRepository_1 = require("../../repositories/publicWitnessArrangementRepository");
const publicWitnessAssignmentRepository_1 = require("../../repositories/publicWitnessAssignmentRepository");
const publicWitnessAssignmentPublisherRepository_1 = require("../../repositories/publicWitnessAssignmentPublisherRepository");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const publicWitnessTimeSlotDefaultPublisherRepository_1 = require("../../repositories/publicWitnessTimeSlotDefaultPublisherRepository");
const typeorm_1 = require("typeorm");
class PublicWitnessScheduleController {
    async createMultiple(req, res) {
        var _a;
        const { schedule } = req.body;
        const { arrangement_id } = req.params;
        const arrangement = await publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.findOne({
            where: { id: arrangement_id },
            relations: ["timeSlots"]
        });
        if (!arrangement)
            throw new api_errors_1.NotFoundError("Arrangement not found");
        const allCreatedAssignments = [];
        for (const daySchedule of schedule) {
            const scheduleDate = (0, dayjs_1.default)(daySchedule.date);
            // Validação da data
            if (arrangement.is_fixed) {
                if (arrangement.weekday === null || scheduleDate.day() !== arrangement.weekday) {
                    throw new api_errors_1.BadRequestError(`The date ${daySchedule.date} does not match the weekday of the fixed arrangement`);
                }
            }
            else {
                if (!arrangement.date || arrangement.date !== daySchedule.date) {
                    throw new api_errors_1.BadRequestError(`The date ${daySchedule.date} must match the specific date of the arrangement`);
                }
            }
            const createdAssignments = [];
            for (const slotPayload of daySchedule.slots) {
                const timeSlot = arrangement.timeSlots.find(ts => ts.id === slotPayload.time_slot_id);
                if (!timeSlot) {
                    throw new api_errors_1.BadRequestError(`Time slot ${slotPayload.time_slot_id} does not exist in the arrangement`);
                }
                // FIXOS
                const defaultPublishers = await publicWitnessTimeSlotDefaultPublisherRepository_1.publicWitnessTimeSlotDefaultPublisherRepository.find({
                    where: { time_slot_id: timeSlot.id },
                    relations: ["publisher"],
                    order: { order: "ASC" }
                });
                if (defaultPublishers.length > 0) {
                    createdAssignments.push({
                        time_slot_id: timeSlot.id,
                        publishers: defaultPublishers.map(dp => ({
                            publisher_id: dp.publisher.id,
                            name: dp.publisher.fullName,
                            order: dp.order
                        })),
                        fixed: true
                    });
                    continue;
                }
                // ROTATIVOS
                let assignment = await publicWitnessAssignmentRepository_1.publicWitnessAssignmentRepository.findOne({
                    where: { date: daySchedule.date, time_slot_id: timeSlot.id },
                    relations: ["publishers", "publishers.publisher"]
                });
                if (!slotPayload.publishers || slotPayload.publishers.length === 0) {
                    // ❌ Sem publishers: remove assignment se existir
                    if (assignment) {
                        await publicWitnessAssignmentPublisherRepository_1.publicWitnessAssignmentPublisherRepository.remove(assignment.publishers);
                        await publicWitnessAssignmentRepository_1.publicWitnessAssignmentRepository.remove(assignment);
                    }
                    continue;
                }
                // 🔹 Se houver publishers, cria/atualiza assignment
                if (!assignment) {
                    assignment = publicWitnessAssignmentRepository_1.publicWitnessAssignmentRepository.create({
                        date: daySchedule.date,
                        time_slot_id: timeSlot.id,
                        timeSlot: timeSlot
                    });
                    await publicWitnessAssignmentRepository_1.publicWitnessAssignmentRepository.save(assignment);
                }
                else {
                    // Remove publishers antigos antes de atualizar
                    if (assignment.publishers.length > 0) {
                        await publicWitnessAssignmentPublisherRepository_1.publicWitnessAssignmentPublisherRepository.remove(assignment.publishers);
                    }
                }
                // Vincula publishers novos
                for (const pub of slotPayload.publishers) {
                    const publisher = await publisherRepository_1.publisherRepository.findOneBy({ id: pub.publisher_id });
                    if (!publisher)
                        throw new api_errors_1.NotFoundError(`Publisher ${pub.publisher_id} not found`);
                    const assignmentPublisher = publicWitnessAssignmentPublisherRepository_1.publicWitnessAssignmentPublisherRepository.create({
                        assignment_id: assignment.id,
                        publisher_id: publisher.id,
                        order: (_a = pub.order) !== null && _a !== void 0 ? _a : 0
                    });
                    await publicWitnessAssignmentPublisherRepository_1.publicWitnessAssignmentPublisherRepository.save(assignmentPublisher);
                }
                const assignmentWithPublishers = await publicWitnessAssignmentRepository_1.publicWitnessAssignmentRepository.findOne({
                    where: { id: assignment.id },
                    relations: ["publishers", "publishers.publisher"]
                });
                createdAssignments.push({ ...assignmentWithPublishers, fixed: false });
            }
            allCreatedAssignments.push({
                date: daySchedule.date,
                assignments: createdAssignments
            });
        }
        return res.status(201).json({
            arrangement_id: arrangement.id,
            schedule: allCreatedAssignments
        });
    }
    async getByDateRange(req, res) {
        const { arrangement_id } = req.params;
        const { start_date, end_date } = req.query;
        if (!start_date || !end_date) {
            throw new api_errors_1.BadRequestError("start_date and end_date are required");
        }
        const start = (0, dayjs_1.default)(start_date.toString());
        const end = (0, dayjs_1.default)(end_date.toString());
        if (!start.isValid() || !end.isValid()) {
            throw new api_errors_1.BadRequestError("Invalid date format. Use YYYY-MM-DD");
        }
        if (end.isBefore(start)) {
            throw new api_errors_1.BadRequestError("end_date must be after start_date");
        }
        const arrangement = await publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.findOne({
            where: { id: arrangement_id }
        });
        if (!arrangement) {
            throw new api_errors_1.NotFoundError("Arrangement not found");
        }
        const assignments = await publicWitnessAssignmentRepository_1.publicWitnessAssignmentRepository.find({
            where: {
                timeSlot: {
                    arrangement_id
                },
                date: (0, typeorm_1.Between)(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"))
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
        });
        // 🔁 Agrupar por data
        const scheduleMap = {};
        for (const assignment of assignments) {
            if (!scheduleMap[assignment.date]) {
                scheduleMap[assignment.date] = [];
            }
            scheduleMap[assignment.date].push({
                id: assignment.id,
                time_slot_id: assignment.time_slot_id,
                date: assignment.date,
                created_at: assignment.created_at,
                fixed: false,
                publishers: assignment.publishers
            });
        }
        const schedule = Object.entries(scheduleMap).map(([date, assignments]) => ({
            date,
            assignments
        }));
        return res.json({
            arrangement_id,
            start_date,
            end_date,
            schedule
        });
    }
    // =========================
    // Rota para retornar schedule (fixos + rodízio)
    // =========================
    async getPublicWitnessScheduleByCongregation(req, res) {
        const { congregation_id } = req.params;
        const arrangements = await publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.find({
            where: { congregation_id },
            relations: [
                "timeSlots",
                "timeSlots.defaultPublishers",
                "timeSlots.defaultPublishers.publisher"
            ]
        });
        const today = (0, dayjs_1.default)().format("YYYY-MM-DD");
        const fixedSchedules = [];
        const rotationBlocks = [];
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
                        publishers: slot.defaultPublishers.map(dp => {
                            var _a;
                            return ({
                                id: dp.publisher.id,
                                name: dp.publisher.nickname ? dp.publisher.nickname : (_a = dp.publisher.fullName) !== null && _a !== void 0 ? _a : "-"
                            });
                        })
                    });
                    continue;
                }
                /* ================= RODÍZIO ================= */
                const assignments = await publicWitnessAssignmentRepository_1.publicWitnessAssignmentRepository.find({
                    where: {
                        time_slot_id: slot.id,
                        date: (0, typeorm_1.Between)(today, "9999-12-31")
                    },
                    relations: ["publishers", "publishers.publisher"],
                    order: {
                        date: "ASC",
                        publishers: { order: "ASC" }
                    }
                });
                if (!assignments.length)
                    continue;
                rotationBlocks.push({
                    title: arr.title,
                    weekday: arr.weekday,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    schedules: assignments.map(a => ({
                        date: a.date,
                        publishers: a.publishers.map(p => {
                            var _a;
                            return ({
                                id: p.publisher.id,
                                name: p.publisher.nickname ? p.publisher.nickname : (_a = p.publisher.fullName) !== null && _a !== void 0 ? _a : "-"
                            });
                        })
                    }))
                });
            }
        }
        return res.json({ fixedSchedules, rotationBlocks });
    }
    async getPdfByCongregation(req, res) {
        const { congregation_id } = req.params;
        const { start, end } = req.query;
        if ((start && !end) || (!start && end)) {
            throw new api_errors_1.BadRequestError("You need to specify both the start and the end.");
        }
        const startDate = (0, dayjs_1.default)(start === null || start === void 0 ? void 0 : start.toString());
        const endDate = (0, dayjs_1.default)(end === null || end === void 0 ? void 0 : end.toString());
        if (!startDate.isValid() || !endDate.isValid()) {
            throw new api_errors_1.BadRequestError("Invalid date format. Use YYYY-MM-DD");
        }
        if (endDate.isBefore(startDate)) {
            throw new api_errors_1.BadRequestError("end must be after start");
        }
        const arrangements = await publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.find({
            where: { congregation_id },
            relations: [
                "timeSlots",
                "timeSlots.defaultPublishers",
                "timeSlots.defaultPublishers.publisher"
            ]
        });
        const fixedSchedules = [];
        const rotationBlocksMap = new Map();
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
                        publishers: slot.defaultPublishers.map(dp => {
                            var _a, _b;
                            return ({
                                id: dp.publisher.id,
                                name: (_b = (_a = dp.publisher.nickname) !== null && _a !== void 0 ? _a : dp.publisher.fullName) !== null && _b !== void 0 ? _b : "-"
                            });
                        })
                    });
                    continue;
                }
                /* ================= RODÍZIO ================= */
                const where = { time_slot_id: slot.id };
                // 🔹 Aplica filtro por data somente se ambas as datas forem passadas
                if (startDate && endDate) {
                    where.date = (0, typeorm_1.Between)(startDate, endDate);
                }
                const assignments = await publicWitnessAssignmentRepository_1.publicWitnessAssignmentRepository.find({
                    where,
                    relations: ["publishers", "publishers.publisher"],
                    order: {
                        date: "ASC",
                        publishers: { order: "ASC" }
                    }
                });
                if (!assignments.length)
                    continue;
                // 🔑 AGRUPA POR ARRANJO (não por horário)
                const blockKey = `${arr.id}`;
                if (!rotationBlocksMap.has(blockKey)) {
                    rotationBlocksMap.set(blockKey, {
                        title: arr.title,
                        weekday: arr.weekday,
                        schedules: []
                    });
                }
                const block = rotationBlocksMap.get(blockKey);
                for (const a of assignments) {
                    // 🔹 Agrupa por data
                    let day = block.schedules.find((s) => s.date === a.date);
                    if (!day) {
                        day = {
                            date: a.date,
                            slots: []
                        };
                        block.schedules.push(day);
                    }
                    // 🔹 Agrupa horários dentro da data
                    day.slots.push({
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                        publishers: a.publishers.map(p => {
                            var _a, _b;
                            return ({
                                id: p.publisher.id,
                                name: (_b = (_a = p.publisher.nickname) !== null && _a !== void 0 ? _a : p.publisher.fullName) !== null && _b !== void 0 ? _b : "-"
                            });
                        })
                    });
                }
            }
        }
        return res.json({
            fixedSchedules,
            rotationBlocks: Array.from(rotationBlocksMap.values())
        });
    }
    async getAssignmentsHistory(req, res) {
        const { congregation_id } = req.params;
        // Busca todos os assignments da congregação
        const assignments = await publicWitnessAssignmentRepository_1.publicWitnessAssignmentRepository.find({
            where: {
                timeSlot: {
                    arrangement: { congregation_id }
                }
            },
            relations: ["publishers", "publishers.publisher", "timeSlot", "timeSlot.arrangement"],
            order: {
                date: "ASC",
                publishers: { order: "ASC" }
            }
        });
        // Agrupa por arranjo → data → horário
        const historyMap = new Map(); // key = arrangement_id
        for (const a of assignments) {
            const arrId = a.timeSlot.arrangement.id;
            if (!historyMap.has(arrId)) {
                historyMap.set(arrId, {
                    arrangement_id: arrId,
                    title: a.timeSlot.arrangement.title,
                    schedule: []
                });
            }
            const arrBlock = historyMap.get(arrId);
            // Agrupa por data
            let day = arrBlock.schedule.find((s) => s.date === a.date);
            if (!day) {
                day = { date: a.date, slots: [] };
                arrBlock.schedule.push(day);
            }
            day.slots.push({
                start_time: a.timeSlot.start_time,
                end_time: a.timeSlot.end_time,
                publishers: a.publishers.map(p => {
                    var _a, _b;
                    return ({
                        id: p.publisher.id,
                        name: (_b = (_a = p.publisher.nickname) !== null && _a !== void 0 ? _a : p.publisher.fullName) !== null && _b !== void 0 ? _b : "-"
                    });
                })
            });
        }
        return res.json({
            history: Array.from(historyMap.values())
        });
    }
}
exports.default = new PublicWitnessScheduleController();
