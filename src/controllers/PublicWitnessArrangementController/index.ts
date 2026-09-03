import { Response } from "express"
import { PublicWitnessTimeSlot } from "../../entities/PublicWitnessTimeSlot"
import { BadRequestError, NotFoundError } from "../../helpers/api-errors"
import { congregationRepository } from "../../repositories/congregationRepository"
import { publicWitnessArrangementRepository } from "../../repositories/publicWitnessArrangementRepository"
import { publicWitnessTimeSlotDefaultPublisherRepository } from "../../repositories/publicWitnessTimeSlotDefaultPublisherRepository"
import { publicWitnessTimeSlotPreferenceRepository } from "../../repositories/publicWitnessTimeSlotPreferenceRepository"
import { publicWitnessTimeSlotRepository } from "../../repositories/publicWitnessTimeSlotRepository"
import { CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest"
import { BodyArrangementCreate, BodyArrangementUpdate, BodyUpdateSlotPreferences, ParamsArrangement, ParamsCongregation } from "./types"

class PublicWitnessArrangementController {

  // =========================
  // Criar arranjo com horários
  // =========================
  async create(req: CustomRequestPT<ParamsCongregation, BodyArrangementCreate>, res: Response) {
    const { timeSlots, ...arrangementData } = req.body
    const { congregation_id } = req.params

    const congregation = await congregationRepository.findOneBy({ id: congregation_id })
    if (!congregation) throw new NotFoundError("Congregation not found")

    if (arrangementData.is_fixed && (arrangementData.weekday === null || arrangementData.weekday === undefined)) {
      throw new BadRequestError("Weekday is required for fixed arrangements")
    }

    if (!arrangementData.is_fixed && !arrangementData.date) {
      throw new BadRequestError("Date is required for non-fixed arrangements")
    }

    const arrangement = publicWitnessArrangementRepository.create({
      congregation,
      congregation_id: congregation.id,
      ...arrangementData
    })
    await publicWitnessArrangementRepository.save(arrangement)

    // Criar horários
    if (timeSlots && timeSlots.length > 0) {
      for (const slot of timeSlots) {
        const ts = publicWitnessTimeSlotRepository.create({
          start_time: slot.start_time,
          end_time: slot.end_time,
          order: slot.order ?? 0,
          arrangement_id: arrangement.id,
          is_rotative: slot.is_rotative ?? false
        })
        await publicWitnessTimeSlotRepository.save(ts)

        if (!ts.is_rotative) {
          // se não é rodízio, precisa ter publishers fixos
          if (!slot.defaultPublishers || slot.defaultPublishers.length === 0) {
            throw new BadRequestError("Non-rotative time slots must have default publishers")
          }
        }

        if (slot.defaultPublishers && slot.defaultPublishers.length > 0) {
          const defaultPubs = slot.defaultPublishers.map(dp =>
            publicWitnessTimeSlotDefaultPublisherRepository.create({
              time_slot_id: ts.id,
              publisher_id: dp.publisher_id,
              order: dp.order ?? 0
            })
          )
          await publicWitnessTimeSlotDefaultPublisherRepository.save(defaultPubs)
        }

        if (slot.preferences && slot.preferences.length > 0) {
          const prefs = slot.preferences.map(pref =>
            publicWitnessTimeSlotPreferenceRepository.create({
              time_slot_id: ts.id,
              publisher_id: pref.publisher_id
            })
          )
          await publicWitnessTimeSlotPreferenceRepository.save(prefs)
        }
      }
    }

    const arrangementWithSlots = await publicWitnessArrangementRepository.findOne({
      where: { id: arrangement.id },
      relations: [
        "timeSlots",
        "timeSlots.defaultPublishers",
        "timeSlots.defaultPublishers.publisher",
        "timeSlots.preferences",
        "timeSlots.preferences.publisher"
      ]
    })

    return res.status(201).json(arrangementWithSlots)
  }

  // =========================
  // Atualizar arranjo
  // =========================
  async update(
    req: CustomRequestPT<ParamsArrangement, BodyArrangementUpdate>,
    res: Response
  ) {
    const { arrangement_id } = req.params
    const { timeSlots, ...arrangementData } = req.body

    const arrangement = await publicWitnessArrangementRepository.findOne({
      where: { id: arrangement_id },
      relations: ["timeSlots", "timeSlots.defaultPublishers", "timeSlots.preferences"]
    })
    if (!arrangement) throw new NotFoundError("Arrangement not found")

    if (
      arrangementData.is_fixed &&
      (arrangementData.weekday === null || arrangementData.weekday === undefined)
    ) {
      throw new BadRequestError("Weekday is required for fixed arrangements")
    }

    if (!arrangementData.is_fixed && !arrangementData.date) {
      throw new BadRequestError("Date is required for non-fixed arrangements")
    }

    Object.assign(arrangement, arrangementData)
    await publicWitnessArrangementRepository.save(arrangement)

    /* ================= Atualiza horários ================= */
    if (timeSlots) {
      const incomingIds = timeSlots
        .filter(s => s.id)
        .map(s => s.id as string)

      /* ---- Removidos ---- */
      const slotsToDelete = arrangement.timeSlots.filter(
        slot => !incomingIds.includes(slot.id)
      )

      if (slotsToDelete.length) {
        for (const slot of slotsToDelete) {
          if (slot.defaultPublishers?.length) {
            await publicWitnessTimeSlotDefaultPublisherRepository.remove(
              slot.defaultPublishers
            )
          }
          if (slot.preferences?.length) {
            await publicWitnessTimeSlotPreferenceRepository.remove(
              slot.preferences
            )
          }
        }
        await publicWitnessTimeSlotRepository.remove(slotsToDelete)
      }

      /* ---- Criar / Atualizar ---- */
      for (const slot of timeSlots) {
        let ts: PublicWitnessTimeSlot | null = null

        if (slot.id) {
          // ✏️ update
          ts = arrangement.timeSlots.find(s => s.id === slot.id) ?? null
          if (!ts) continue

          Object.assign(ts, {
            start_time: slot.start_time,
            end_time: slot.end_time,
            order: slot.order ?? 0,
            is_rotative: slot.is_rotative ?? false
          })

          await publicWitnessTimeSlotRepository.save(ts)

          if (ts.defaultPublishers?.length) {
            await publicWitnessTimeSlotDefaultPublisherRepository.remove(
              ts.defaultPublishers
            )
          }
          await publicWitnessTimeSlotPreferenceRepository.delete({ time_slot_id: ts.id })
        } else {
          // 🆕 create
          ts = publicWitnessTimeSlotRepository.create({
            arrangement_id: arrangement.id,
            start_time: slot.start_time,
            end_time: slot.end_time,
            order: slot.order ?? 0,
            is_rotative: slot.is_rotative ?? false
          })
          await publicWitnessTimeSlotRepository.save(ts)
        }

        // 🔒 Garantia para TS e lógica
        if (!ts) continue

        const timeSlot = ts // 🔒 trava o tipo

        // validação
        if (!timeSlot.is_rotative && (!slot.defaultPublishers || slot.defaultPublishers.length === 0)) {
          throw new BadRequestError(
            "Non-rotative time slots must have default publishers"
          )
        }

        if (slot.defaultPublishers?.length) {
          const defaultPubs = slot.defaultPublishers.map(dp =>
            publicWitnessTimeSlotDefaultPublisherRepository.create({
              time_slot_id: timeSlot.id,
              publisher_id: dp.publisher_id,
              order: dp.order ?? 0
            })
          )
          await publicWitnessTimeSlotDefaultPublisherRepository.save(defaultPubs)
        }

        if (slot.preferences?.length) {
          const prefs = slot.preferences.map(pref =>
            publicWitnessTimeSlotPreferenceRepository.create({
              time_slot_id: timeSlot.id,
              publisher_id: pref.publisher_id
            })
          )
          await publicWitnessTimeSlotPreferenceRepository.save(prefs)
        }
      }
    }

    const arrangementWithSlots = await publicWitnessArrangementRepository.findOne({
      where: { id: arrangement.id },
      relations: [
        "timeSlots",
        "timeSlots.defaultPublishers",
        "timeSlots.defaultPublishers.publisher",
        "timeSlots.preferences",
        "timeSlots.preferences.publisher"
      ]
    })

    return res.json(arrangementWithSlots)
  }

  // =========================
  // Atualizar preferências dos horários diretamente
  // =========================
  async updateSlotPreferences(
    req: CustomRequestPT<ParamsArrangement, BodyUpdateSlotPreferences>,
    res: Response
  ) {
    const { arrangement_id } = req.params
    const { preferences } = req.body

    const arrangement = await publicWitnessArrangementRepository.findOne({
      where: { id: arrangement_id },
      relations: ["timeSlots"]
    })
    if (!arrangement) throw new NotFoundError("Arrangement not found")

    if (preferences && Array.isArray(preferences)) {
      for (const slotPref of preferences) {
        const slot = arrangement.timeSlots.find(s => s.id === slotPref.time_slot_id)
        if (!slot) continue

        await publicWitnessTimeSlotPreferenceRepository.delete({ time_slot_id: slot.id })

        if (slotPref.publisher_ids && slotPref.publisher_ids.length > 0) {
          const newPrefs = slotPref.publisher_ids.map(pubId =>
            publicWitnessTimeSlotPreferenceRepository.create({
              time_slot_id: slot.id,
              publisher_id: pubId
            })
          )
          await publicWitnessTimeSlotPreferenceRepository.save(newPrefs)
        }
      }
    }

    const updatedArrangement = await publicWitnessArrangementRepository.findOne({
      where: { id: arrangement.id },
      relations: [
        "timeSlots",
        "timeSlots.defaultPublishers",
        "timeSlots.defaultPublishers.publisher",
        "timeSlots.preferences",
        "timeSlots.preferences.publisher"
      ]
    })

    return res.json(updatedArrangement)
  }

  // =========================
  // Deletar arranjo
  // =========================
  async delete(req: ParamsCustomRequest<ParamsArrangement>, res: Response) {
    const { arrangement_id } = req.params

    const arrangement = await publicWitnessArrangementRepository.findOneBy({ id: arrangement_id })
    if (!arrangement) throw new NotFoundError("Arrangement not found")

    await publicWitnessArrangementRepository.remove(arrangement)

    return res.status(200).end()
  }

  // =========================
  // Buscar todos os arranjos de uma congregação
  // =========================
  async getByCongregation(req: ParamsCustomRequest<ParamsCongregation>, res: Response) {
    const { congregation_id } = req.params

    const arrangements = await publicWitnessArrangementRepository.find({
      where: { congregation_id },
      order: { created_at: "ASC" },
      relations: [
        "timeSlots",
        "timeSlots.defaultPublishers",
        "timeSlots.defaultPublishers.publisher",
        "timeSlots.preferences",
        "timeSlots.preferences.publisher"
      ]
    })

    return res.json(arrangements)
  }

  // =========================
  // Buscar arranjo único
  // =========================
  async getOne(req: ParamsCustomRequest<ParamsArrangement>, res: Response) {
    const { arrangement_id } = req.params

    const arrangement = await publicWitnessArrangementRepository.findOne({
      where: { id: arrangement_id },
      relations: [
        "timeSlots",
        "timeSlots.defaultPublishers",
        "timeSlots.defaultPublishers.publisher",
        "timeSlots.preferences",
        "timeSlots.preferences.publisher"
      ]
    })

    if (!arrangement) throw new NotFoundError("Arrangement not found")

    return res.json(arrangement)
  }
}

export default new PublicWitnessArrangementController()

