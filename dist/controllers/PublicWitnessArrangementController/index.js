"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const publicWitnessArrangementRepository_1 = require("../../repositories/publicWitnessArrangementRepository");
const publicWitnessTimeSlotDefaultPublisherRepository_1 = require("../../repositories/publicWitnessTimeSlotDefaultPublisherRepository");
const publicWitnessTimeSlotRepository_1 = require("../../repositories/publicWitnessTimeSlotRepository");
class PublicWitnessArrangementController {
    // =========================
    // Criar arranjo com horários
    // =========================
    async create(req, res) {
        var _a, _b;
        const { timeSlots, ...arrangementData } = req.body;
        const { congregation_id } = req.params;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation)
            throw new api_errors_1.NotFoundError("Congregation not found");
        if (arrangementData.is_fixed && (arrangementData.weekday === null || arrangementData.weekday === undefined)) {
            throw new api_errors_1.BadRequestError("Weekday is required for fixed arrangements");
        }
        if (!arrangementData.is_fixed && !arrangementData.date) {
            throw new api_errors_1.BadRequestError("Date is required for non-fixed arrangements");
        }
        const arrangement = publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.create({
            congregation,
            congregation_id: congregation.id,
            ...arrangementData
        });
        await publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.save(arrangement);
        // Criar horários
        if (timeSlots && timeSlots.length > 0) {
            for (const slot of timeSlots) {
                const ts = publicWitnessTimeSlotRepository_1.publicWitnessTimeSlotRepository.create({
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    order: (_a = slot.order) !== null && _a !== void 0 ? _a : 0,
                    arrangement_id: arrangement.id,
                    is_rotative: (_b = slot.is_rotative) !== null && _b !== void 0 ? _b : false // ✅ novo campo
                });
                await publicWitnessTimeSlotRepository_1.publicWitnessTimeSlotRepository.save(ts);
                if (!ts.is_rotative) {
                    // se não é rodízio, precisa ter publishers fixos
                    if (!slot.defaultPublishers || slot.defaultPublishers.length === 0) {
                        throw new api_errors_1.BadRequestError("Non-rotative time slots must have default publishers");
                    }
                }
                if (slot.defaultPublishers && slot.defaultPublishers.length > 0) {
                    const defaultPubs = slot.defaultPublishers.map(dp => {
                        var _a;
                        return publicWitnessTimeSlotDefaultPublisherRepository_1.publicWitnessTimeSlotDefaultPublisherRepository.create({
                            time_slot_id: ts.id,
                            publisher_id: dp.publisher_id,
                            order: (_a = dp.order) !== null && _a !== void 0 ? _a : 0
                        });
                    });
                    await publicWitnessTimeSlotDefaultPublisherRepository_1.publicWitnessTimeSlotDefaultPublisherRepository.save(defaultPubs);
                }
            }
        }
        const arrangementWithSlots = await publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.findOne({
            where: { id: arrangement.id },
            relations: ["timeSlots", "timeSlots.defaultPublishers", "timeSlots.defaultPublishers.publisher"]
        });
        return res.status(201).json(arrangementWithSlots);
    }
    // =========================
    // Atualizar arranjo
    // =========================
    async update(req, res) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const { arrangement_id } = req.params;
        const { timeSlots, ...arrangementData } = req.body;
        const arrangement = await publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.findOne({
            where: { id: arrangement_id },
            relations: ["timeSlots", "timeSlots.defaultPublishers"]
        });
        if (!arrangement)
            throw new api_errors_1.NotFoundError("Arrangement not found");
        if (arrangementData.is_fixed &&
            (arrangementData.weekday === null || arrangementData.weekday === undefined)) {
            throw new api_errors_1.BadRequestError("Weekday is required for fixed arrangements");
        }
        if (!arrangementData.is_fixed && !arrangementData.date) {
            throw new api_errors_1.BadRequestError("Date is required for non-fixed arrangements");
        }
        Object.assign(arrangement, arrangementData);
        await publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.save(arrangement);
        /* ================= Atualiza horários ================= */
        if (timeSlots) {
            const incomingIds = timeSlots
                .filter(s => s.id)
                .map(s => s.id);
            /* ---- Removidos ---- */
            const slotsToDelete = arrangement.timeSlots.filter(slot => !incomingIds.includes(slot.id));
            if (slotsToDelete.length) {
                for (const slot of slotsToDelete) {
                    if ((_a = slot.defaultPublishers) === null || _a === void 0 ? void 0 : _a.length) {
                        await publicWitnessTimeSlotDefaultPublisherRepository_1.publicWitnessTimeSlotDefaultPublisherRepository.remove(slot.defaultPublishers);
                    }
                }
                await publicWitnessTimeSlotRepository_1.publicWitnessTimeSlotRepository.remove(slotsToDelete);
            }
            /* ---- Criar / Atualizar ---- */
            for (const slot of timeSlots) {
                let ts = null;
                if (slot.id) {
                    // ✏️ update
                    ts = (_b = arrangement.timeSlots.find(s => s.id === slot.id)) !== null && _b !== void 0 ? _b : null;
                    if (!ts)
                        continue;
                    Object.assign(ts, {
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                        order: (_c = slot.order) !== null && _c !== void 0 ? _c : 0,
                        is_rotative: (_d = slot.is_rotative) !== null && _d !== void 0 ? _d : false
                    });
                    await publicWitnessTimeSlotRepository_1.publicWitnessTimeSlotRepository.save(ts);
                    if ((_e = ts.defaultPublishers) === null || _e === void 0 ? void 0 : _e.length) {
                        await publicWitnessTimeSlotDefaultPublisherRepository_1.publicWitnessTimeSlotDefaultPublisherRepository.remove(ts.defaultPublishers);
                    }
                }
                else {
                    // 🆕 create
                    ts = publicWitnessTimeSlotRepository_1.publicWitnessTimeSlotRepository.create({
                        arrangement_id: arrangement.id,
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                        order: (_f = slot.order) !== null && _f !== void 0 ? _f : 0,
                        is_rotative: (_g = slot.is_rotative) !== null && _g !== void 0 ? _g : false
                    });
                    await publicWitnessTimeSlotRepository_1.publicWitnessTimeSlotRepository.save(ts);
                }
                // 🔒 Garantia para TS e lógica
                if (!ts)
                    continue;
                const timeSlot = ts; // 🔒 trava o tipo
                // validação
                if (!timeSlot.is_rotative && (!slot.defaultPublishers || slot.defaultPublishers.length === 0)) {
                    throw new api_errors_1.BadRequestError("Non-rotative time slots must have default publishers");
                }
                if ((_h = slot.defaultPublishers) === null || _h === void 0 ? void 0 : _h.length) {
                    const defaultPubs = slot.defaultPublishers.map(dp => {
                        var _a;
                        return publicWitnessTimeSlotDefaultPublisherRepository_1.publicWitnessTimeSlotDefaultPublisherRepository.create({
                            time_slot_id: timeSlot.id,
                            publisher_id: dp.publisher_id,
                            order: (_a = dp.order) !== null && _a !== void 0 ? _a : 0
                        });
                    });
                    await publicWitnessTimeSlotDefaultPublisherRepository_1.publicWitnessTimeSlotDefaultPublisherRepository.save(defaultPubs);
                }
            }
        }
        const arrangementWithSlots = await publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.findOne({
            where: { id: arrangement.id },
            relations: ["timeSlots", "timeSlots.defaultPublishers", "timeSlots.defaultPublishers.publisher"]
        });
        return res.json(arrangementWithSlots);
    }
    // =========================
    // Deletar arranjo
    // =========================
    async delete(req, res) {
        const { arrangement_id } = req.params;
        const arrangement = await publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.findOneBy({ id: arrangement_id });
        if (!arrangement)
            throw new api_errors_1.NotFoundError("Arrangement not found");
        // Com onDelete: "CASCADE", TypeORM vai apagar automaticamente
        // todos os timeSlots e defaultPublishers ligados
        await publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.remove(arrangement);
        return res.status(200).end();
    }
    // =========================
    // Buscar todos os arranjos de uma congregação
    // =========================
    async getByCongregation(req, res) {
        const { congregation_id } = req.params;
        const arrangements = await publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.find({
            where: { congregation_id },
            order: { created_at: "ASC" },
            relations: ["timeSlots", "timeSlots.defaultPublishers", "timeSlots.defaultPublishers.publisher"]
        });
        return res.json(arrangements);
    }
    // =========================
    // Buscar arranjo único
    // =========================
    async getOne(req, res) {
        const { arrangement_id } = req.params;
        const arrangement = await publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.findOne({
            where: { id: arrangement_id },
            relations: ["timeSlots", "timeSlots.defaultPublishers", "timeSlots.defaultPublishers.publisher"]
        });
        if (!arrangement)
            throw new api_errors_1.NotFoundError("Arrangement not found");
        return res.json(arrangement);
    }
}
exports.default = new PublicWitnessArrangementController();
