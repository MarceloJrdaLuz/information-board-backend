"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const publicWitnessArrangementRepository_1 = require("../../repositories/publicWitnessArrangementRepository");
const publicWitnessTimeSlotDefaultPublisherRepository_1 = require("../../repositories/publicWitnessTimeSlotDefaultPublisherRepository");
const publicWitnessTimeSlotPreferenceRepository_1 = require("../../repositories/publicWitnessTimeSlotPreferenceRepository");
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
                    is_rotative: (_b = slot.is_rotative) !== null && _b !== void 0 ? _b : false
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
                if (slot.preferences && slot.preferences.length > 0) {
                    const prefs = slot.preferences.map(pref => publicWitnessTimeSlotPreferenceRepository_1.publicWitnessTimeSlotPreferenceRepository.create({
                        time_slot_id: ts.id,
                        publisher_id: pref.publisher_id
                    }));
                    await publicWitnessTimeSlotPreferenceRepository_1.publicWitnessTimeSlotPreferenceRepository.save(prefs);
                }
            }
        }
        const arrangementWithSlots = await publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.findOne({
            where: { id: arrangement.id },
            relations: [
                "timeSlots",
                "timeSlots.defaultPublishers",
                "timeSlots.defaultPublishers.publisher",
                "timeSlots.preferences",
                "timeSlots.preferences.publisher"
            ]
        });
        return res.status(201).json(arrangementWithSlots);
    }
    // =========================
    // Atualizar arranjo
    // =========================
    async update(req, res) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const { arrangement_id } = req.params;
        const { timeSlots, ...arrangementData } = req.body;
        const arrangement = await publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.findOne({
            where: { id: arrangement_id },
            relations: ["timeSlots", "timeSlots.defaultPublishers", "timeSlots.preferences"]
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
                    if ((_b = slot.preferences) === null || _b === void 0 ? void 0 : _b.length) {
                        await publicWitnessTimeSlotPreferenceRepository_1.publicWitnessTimeSlotPreferenceRepository.remove(slot.preferences);
                    }
                }
                await publicWitnessTimeSlotRepository_1.publicWitnessTimeSlotRepository.remove(slotsToDelete);
            }
            /* ---- Criar / Atualizar ---- */
            for (const slot of timeSlots) {
                let ts = null;
                if (slot.id) {
                    // ✏️ update
                    ts = (_c = arrangement.timeSlots.find(s => s.id === slot.id)) !== null && _c !== void 0 ? _c : null;
                    if (!ts)
                        continue;
                    Object.assign(ts, {
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                        order: (_d = slot.order) !== null && _d !== void 0 ? _d : 0,
                        is_rotative: (_e = slot.is_rotative) !== null && _e !== void 0 ? _e : false
                    });
                    await publicWitnessTimeSlotRepository_1.publicWitnessTimeSlotRepository.save(ts);
                    if ((_f = ts.defaultPublishers) === null || _f === void 0 ? void 0 : _f.length) {
                        await publicWitnessTimeSlotDefaultPublisherRepository_1.publicWitnessTimeSlotDefaultPublisherRepository.remove(ts.defaultPublishers);
                    }
                    await publicWitnessTimeSlotPreferenceRepository_1.publicWitnessTimeSlotPreferenceRepository.delete({ time_slot_id: ts.id });
                }
                else {
                    // 🆕 create
                    ts = publicWitnessTimeSlotRepository_1.publicWitnessTimeSlotRepository.create({
                        arrangement_id: arrangement.id,
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                        order: (_g = slot.order) !== null && _g !== void 0 ? _g : 0,
                        is_rotative: (_h = slot.is_rotative) !== null && _h !== void 0 ? _h : false
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
                if ((_j = slot.defaultPublishers) === null || _j === void 0 ? void 0 : _j.length) {
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
                if ((_k = slot.preferences) === null || _k === void 0 ? void 0 : _k.length) {
                    const prefs = slot.preferences.map(pref => publicWitnessTimeSlotPreferenceRepository_1.publicWitnessTimeSlotPreferenceRepository.create({
                        time_slot_id: timeSlot.id,
                        publisher_id: pref.publisher_id
                    }));
                    await publicWitnessTimeSlotPreferenceRepository_1.publicWitnessTimeSlotPreferenceRepository.save(prefs);
                }
            }
        }
        const arrangementWithSlots = await publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.findOne({
            where: { id: arrangement.id },
            relations: [
                "timeSlots",
                "timeSlots.defaultPublishers",
                "timeSlots.defaultPublishers.publisher",
                "timeSlots.preferences",
                "timeSlots.preferences.publisher"
            ]
        });
        return res.json(arrangementWithSlots);
    }
    // =========================
    // Atualizar preferências dos horários diretamente
    // =========================
    async updateSlotPreferences(req, res) {
        const { arrangement_id } = req.params;
        const { preferences } = req.body;
        const arrangement = await publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.findOne({
            where: { id: arrangement_id },
            relations: ["timeSlots"]
        });
        if (!arrangement)
            throw new api_errors_1.NotFoundError("Arrangement not found");
        if (preferences && Array.isArray(preferences)) {
            for (const slotPref of preferences) {
                const slot = arrangement.timeSlots.find(s => s.id === slotPref.time_slot_id);
                if (!slot)
                    continue;
                await publicWitnessTimeSlotPreferenceRepository_1.publicWitnessTimeSlotPreferenceRepository.delete({ time_slot_id: slot.id });
                if (slotPref.publisher_ids && slotPref.publisher_ids.length > 0) {
                    const newPrefs = slotPref.publisher_ids.map(pubId => publicWitnessTimeSlotPreferenceRepository_1.publicWitnessTimeSlotPreferenceRepository.create({
                        time_slot_id: slot.id,
                        publisher_id: pubId
                    }));
                    await publicWitnessTimeSlotPreferenceRepository_1.publicWitnessTimeSlotPreferenceRepository.save(newPrefs);
                }
            }
        }
        const updatedArrangement = await publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.findOne({
            where: { id: arrangement.id },
            relations: [
                "timeSlots",
                "timeSlots.defaultPublishers",
                "timeSlots.defaultPublishers.publisher",
                "timeSlots.preferences",
                "timeSlots.preferences.publisher"
            ]
        });
        return res.json(updatedArrangement);
    }
    // =========================
    // Deletar arranjo
    // =========================
    async delete(req, res) {
        const { arrangement_id } = req.params;
        const arrangement = await publicWitnessArrangementRepository_1.publicWitnessArrangementRepository.findOneBy({ id: arrangement_id });
        if (!arrangement)
            throw new api_errors_1.NotFoundError("Arrangement not found");
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
            relations: [
                "timeSlots",
                "timeSlots.defaultPublishers",
                "timeSlots.defaultPublishers.publisher",
                "timeSlots.preferences",
                "timeSlots.preferences.publisher"
            ]
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
            relations: [
                "timeSlots",
                "timeSlots.defaultPublishers",
                "timeSlots.defaultPublishers.publisher",
                "timeSlots.preferences",
                "timeSlots.preferences.publisher"
            ]
        });
        if (!arrangement)
            throw new api_errors_1.NotFoundError("Arrangement not found");
        return res.json(arrangement);
    }
}
exports.default = new PublicWitnessArrangementController();
