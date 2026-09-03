import dayjs from "dayjs"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import { Between, In, LessThan } from "typeorm"
import { fieldServiceExceptionRepository } from "../../repositories/fieldServiceExceptionRepository"
import { fieldServiceScheduleRepository } from "../../repositories/fieldServiceScheduleRepository"
import { publicWitnessArrangementRepository } from "../../repositories/publicWitnessArrangementRepository"
import { publicWitnessAssignmentPublisherRepository } from "../../repositories/publicWitnessAssignmentPublisherRepository"
import { publicWitnessAssignmentRepository } from "../../repositories/publicWitnessAssignmentRepository"
import { publisherRepository } from "../../repositories/publisherRepository"
import { publisherUnavailabilityRepository } from "../../repositories/publisherUnavailabilityRepository"
import { BadRequestError, NotFoundError } from "../../helpers/api-errors"
import { Situation } from "../../entities/Publisher"

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

interface GeneratePublicWitnessParams {
  arrangement_id: string
  startDate: string
  endDate: string
  mode?: "append" | "reconcile"
  publishersPerSlot?: number
}

function stringHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

function getPairKey(id1: string, id2: string): string {
  return id1 < id2 ? `${id1}:${id2}` : `${id2}:${id1}`
}

function getPairPenalty(
  candId: string,
  currentSelectedIds: string[],
  pairCountMap: Map<string, number>
): number {
  let penalty = 0
  for (const existingId of currentSelectedIds) {
    const key = getPairKey(candId, existingId)
    penalty += pairCountMap.get(key) || 0
  }
  return penalty
}

function getGenderNormalized(gender?: string): "M" | "F" {
  if (!gender) return "M"
  const g = gender.trim().toLowerCase()
  if (g.startsWith("f")) return "F"
  return "M"
}

/**
 * Regra: Um homem e uma mulher só podem ficar juntos se forem da mesma família!
 */
function areGendersCompatible(
  pubA: { gender?: string; family_id?: string | null },
  pubB: { gender?: string; family_id?: string | null }
): boolean {
  const genderA = getGenderNormalized(pubA.gender)
  const genderB = getGenderNormalized(pubB.gender)

  // Mesmo gênero (homem com homem, ou mulher com mulher) -> sempre permitido
  if (genderA === genderB) return true

  // Gêneros diferentes (homem com mulher):
  // Somente permitidos se pertencerem comprovadamente à mesma família
  if (pubA.family_id && pubB.family_id && pubA.family_id === pubB.family_id) {
    return true
  }

  // Caso contrário, homem e mulher não podem ficar juntos
  return false
}

export async function generatePublicWitnessSchedules({
  arrangement_id,
  startDate,
  endDate,
  mode = "reconcile",
  publishersPerSlot = 2
}: GeneratePublicWitnessParams) {
  /* =========================================================
   * 1. Buscar arranjo com horários, preferências e publishers
   * ========================================================= */
  const arrangement = await publicWitnessArrangementRepository.findOne({
    where: { id: arrangement_id },
    relations: [
      "timeSlots",
      "timeSlots.preferences",
      "timeSlots.preferences.publisher",
      "timeSlots.defaultPublishers",
      "timeSlots.defaultPublishers.publisher"
    ]
  })

  if (!arrangement) {
    throw new NotFoundError("Arranjo de testemunho público não encontrado")
  }

  const congregation_id = arrangement.congregation_id

  /* =========================================================
   * 2. Determinar datas válidas no período
   * ========================================================= */
  const start = dayjs(startDate)
  const end = dayjs(endDate)

  if (!start.isValid() || !end.isValid()) {
    throw new BadRequestError("Formato de data inválido. Utilize YYYY-MM-DD")
  }

  if (end.isBefore(start)) {
    throw new BadRequestError("A data final deve ser igual ou posterior à data inicial")
  }

  const candidateDates: string[] = []
  if (arrangement.is_fixed) {
    if (arrangement.weekday === null || arrangement.weekday === undefined) {
      throw new BadRequestError("Arranjo fixo deve ter um dia da semana definido")
    }
    let cur = start.clone()
    while (cur.isSameOrBefore(end)) {
      if (cur.day() === arrangement.weekday) {
        candidateDates.push(cur.format("YYYY-MM-DD"))
      }
      cur = cur.add(1, "day")
    }
  } else {
    if (arrangement.date) {
      const arrDate = dayjs(arrangement.date)
      if (arrDate.isSameOrAfter(start) && arrDate.isSameOrBefore(end)) {
        candidateDates.push(arrDate.format("YYYY-MM-DD"))
      }
    }
  }

  if (candidateDates.length === 0) {
    return {
      message: "Nenhuma data compatível com o arranjo no período informado",
      totalAssignments: 0,
      datesProcessed: 0
    }
  }

  /* =========================================================
   * 3. Buscar exceções do período (dias sem atividade)
   * ========================================================= */
  const exceptions = await fieldServiceExceptionRepository.find({
    where: {
      congregation_id,
      date: Between(startDate, endDate)
    }
  })
  const exceptionDates = new Set(exceptions.map(e => e.date))

  const validDates = candidateDates.filter(d => !exceptionDates.has(d))
  if (validDates.length === 0) {
    return {
      message: "Todas as datas do período coincidem com exceções cadastradas",
      totalAssignments: 0,
      datesProcessed: 0
    }
  }

  /* =========================================================
   * 4. Buscar publicadores ativos com privilégio de Testemunho Público
   * ========================================================= */
  const publishers = await publisherRepository.find({
    where: {
      congregation: { id: congregation_id },
      situation: Situation.Ativo
    },
    relations: ["privilegesRelation", "privilegesRelation.privilege"]
  })

  const eligiblePublishers = publishers.filter(p =>
    p.privilegesRelation?.some(pr => pr.privilege?.name === "Public Witness")
  )

  if (eligiblePublishers.length === 0) {
    throw new BadRequestError(
      "Nenhum publicador ativo com o privilégio de 'Testemunho Público' foi encontrado nesta congregação."
    )
  }

  /* =========================================================
   * 5. Buscar indisponibilidades dos publicadores no período
   * ========================================================= */
  const unavailabilities = await publisherUnavailabilityRepository.find({
    where: {
      publisher: { congregation: { id: congregation_id } }
    }
  })

  const isPublisherUnavailable = (pubId: string, dateStr: string): boolean => {
    return unavailabilities.some(u => {
      if (u.publisher_id !== pubId) return false
      return dateStr >= u.startDate && dateStr <= u.endDate
    })
  }

  /* =========================================================
   * 6. Buscar dirigentes de campo do período (evitar conflito)
   * ========================================================= */
  const fieldSchedules = await fieldServiceScheduleRepository.find({
    where: {
      template: { congregation_id },
      date: Between(startDate, endDate)
    }
  })

  const fieldLeadersByDate = new Map<string, Set<string>>()
  for (const fs of fieldSchedules) {
    if (!fieldLeadersByDate.has(fs.date)) {
      fieldLeadersByDate.set(fs.date, new Set())
    }
    if (fs.leader_id) {
      fieldLeadersByDate.get(fs.date)!.add(fs.leader_id)
    }
  }

  /* =========================================================
   * 7. Mapeamento de preferências de horários
   *    REGRA: Se um publicador possui preferência cadastrada
   *    para algum(ns) horário(s), ele NUNCA pode ser colocado em outro.
   * ========================================================= */
  const publisherSlotPreferences = new Map<string, Set<string>>() // publisher_id -> Set<slot_id>

  for (const slot of arrangement.timeSlots) {
    if (slot.preferences?.length) {
      for (const pref of slot.preferences) {
        if (!publisherSlotPreferences.has(pref.publisher_id)) {
          publisherSlotPreferences.set(pref.publisher_id, new Set())
        }
        publisherSlotPreferences.get(pref.publisher_id)!.add(slot.id)
      }
    }
  }

  const canPublisherTakeSlot = (publisherId: string, slotId: string): boolean => {
    const preferences = publisherSlotPreferences.get(publisherId)
    // Se não há preferência registrada para o arranjo, publicador é flexível (pode assumir qualquer horário)
    if (!preferences || preferences.size === 0) return true
    // Se há preferência registrada, só pode participar do slot se estiver na preferência
    return preferences.has(slotId)
  }

  /* =========================================================
   * 8. Histórico passado, pares e contadores para rodízio justo
   * ========================================================= */
  const pastAssignments = await publicWitnessAssignmentPublisherRepository.find({
    where: {
      assignment: {
        timeSlot: {
          arrangement: { congregation_id }
        },
        date: LessThan(startDate)
      }
    },
    relations: ["assignment"],
    order: { assignment: { date: "DESC" } }
  })

  const lastAssignedDateMap = new Map<string, string>()
  const pastAssignmentsGroupMap = new Map<string, string[]>()
  const pairCountMap = new Map<string, number>() // pairKey -> count

  for (const pa of pastAssignments) {
    if (pa.assignment?.date && !lastAssignedDateMap.has(pa.publisher_id)) {
      lastAssignedDateMap.set(pa.publisher_id, pa.assignment.date)
    }

    if (pa.assignment_id && pa.publisher_id) {
      if (!pastAssignmentsGroupMap.has(pa.assignment_id)) {
        pastAssignmentsGroupMap.set(pa.assignment_id, [])
      }
      pastAssignmentsGroupMap.get(pa.assignment_id)!.push(pa.publisher_id)
    }
  }

  // Preenche pares prévios vindos do histórico anterior
  for (const pubs of pastAssignmentsGroupMap.values()) {
    for (let i = 0; i < pubs.length; i++) {
      for (let j = i + 1; j < pubs.length; j++) {
        const key = getPairKey(pubs[i], pubs[j])
        pairCountMap.set(key, (pairCountMap.get(key) || 0) + 1)
      }
    }
  }

  // Contador de designações no período gerado para manter equilíbrio
  const periodCountMap = new Map<string, number>()
  for (const p of eligiblePublishers) {
    periodCountMap.set(p.id, 0)
  }

  /* =========================================================
   * 9. Lidar com o modo: Reconcile vs Append
   * ========================================================= */
  const rotativeSlots = arrangement.timeSlots.filter(s => s.is_rotative)
  const rotativeSlotIds = rotativeSlots.map(s => s.id)

  if (mode === "reconcile" && rotativeSlotIds.length > 0) {
    // Busca e remove designações existentes dos horários rotativos no período
    for (const slotId of rotativeSlotIds) {
      const existing = await publicWitnessAssignmentRepository.find({
        where: {
          time_slot_id: slotId,
          date: Between(startDate, endDate)
        },
        relations: ["publishers"]
      })

      for (const item of existing) {
        if (item.publishers?.length) {
          await publicWitnessAssignmentPublisherRepository.remove(item.publishers)
        }
        await publicWitnessAssignmentRepository.remove(item)
      }
    }
  } else if (mode === "append" && rotativeSlotIds.length > 0) {
    // Pré-computa o total de designações já existentes no período e os pares já formados
    const existingInPeriod = await publicWitnessAssignmentPublisherRepository.find({
      where: {
        assignment: {
          time_slot_id: In(rotativeSlotIds),
          date: Between(startDate, endDate)
        }
      },
      relations: ["assignment"]
    })

    const existingPeriodGroupMap = new Map<string, string[]>()
    for (const ep of existingInPeriod) {
      periodCountMap.set(ep.publisher_id, (periodCountMap.get(ep.publisher_id) || 0) + 1)
      if (ep.assignment_id && ep.publisher_id) {
        if (!existingPeriodGroupMap.has(ep.assignment_id)) {
          existingPeriodGroupMap.set(ep.assignment_id, [])
        }
        existingPeriodGroupMap.get(ep.assignment_id)!.push(ep.publisher_id)
      }
    }

    for (const pubs of existingPeriodGroupMap.values()) {
      for (let i = 0; i < pubs.length; i++) {
        for (let j = i + 1; j < pubs.length; j++) {
          const key = getPairKey(pubs[i], pubs[j])
          pairCountMap.set(key, (pairCountMap.get(key) || 0) + 1)
        }
      }
    }
  }

  /* =========================================================
   * 10. Geração do Rodízio com Diversificação e Regra Familiar
   * ========================================================= */
  let totalAssignmentsCreated = 0

  for (const date of validDates) {
    const assignedOnDate = new Set<string>()

    // Bloqueia dirigentes de campo do dia
    const leadersToday = fieldLeadersByDate.get(date)
    if (leadersToday) {
      leadersToday.forEach(id => assignedOnDate.add(id))
    }

    // Bloqueia publishers fixos dos horários fixos
    for (const slot of arrangement.timeSlots) {
      if (!slot.is_rotative && slot.defaultPublishers?.length) {
        slot.defaultPublishers.forEach(dp => assignedOnDate.add(dp.publisher_id))
      }
    }

    // Processa os horários rotativos
    // Ordena slots: dá prioridade a slots que possuem mais restrições/preferências específicas
    const sortedRotativeSlots = [...rotativeSlots].sort((a, b) => {
      const aPrefs = a.preferences?.length ?? 0
      const bPrefs = b.preferences?.length ?? 0
      if (aPrefs !== bPrefs) return bPrefs - aPrefs
      return a.order - b.order
    })

    for (const slot of sortedRotativeSlots) {
      let existingAssignment = await publicWitnessAssignmentRepository.findOne({
        where: {
          time_slot_id: slot.id,
          date
        },
        relations: ["publishers", "publishers.publisher"]
      })

      let currentPublishers: string[] = []

      if (existingAssignment && mode === "append") {
        currentPublishers = existingAssignment.publishers?.map(p => p.publisher_id) ?? []
        currentPublishers.forEach(id => {
          assignedOnDate.add(id)
        })
      }

      const neededCount = Math.max(0, publishersPerSlot - currentPublishers.length)
      if (neededCount === 0) continue

      const selected: typeof eligiblePublishers = []
      const currentSelectedPublishers: typeof eligiblePublishers = []

      if (existingAssignment && mode === "append" && existingAssignment.publishers?.length) {
        for (const ep of existingAssignment.publishers) {
          const foundPub = eligiblePublishers.find(p => p.id === ep.publisher_id)
          if (foundPub) {
            currentSelectedPublishers.push(foundPub)
          }
        }
      }

      // Seleciona um a um para cada vaga do slot, respeitando preferências, compatibilidade de gênero e diversificação
      for (let slotPos = 0; slotPos < neededCount; slotPos++) {
        const candidates = eligiblePublishers.filter(pub => {
          // 1. Não pode estar indisponível na data
          if (isPublisherUnavailable(pub.id, date)) return false

          // 2. Não pode estar designado para outro slot ou saída no mesmo dia
          if (assignedOnDate.has(pub.id)) return false

          // 3. Não pode já estar selecionado nesta vaga
          if (currentSelectedPublishers.some(p => p.id === pub.id)) return false

          // 4. Regra estrita de preferência de horários
          if (!canPublisherTakeSlot(pub.id, slot.id)) return false

          // 5. REGRA ESTRITA DE GÊNERO / FAMÍLIA:
          // Homem e mulher só podem ficar juntos se forem da mesma família!
          if (currentSelectedPublishers.length > 0) {
            const isCompatibleWithAll = currentSelectedPublishers.every(existing =>
              areGendersCompatible(pub, existing)
            )
            if (!isCompatibleWithAll) return false
          }

          return true
        })

        if (candidates.length === 0) break

        const currentSelectedIds = currentSelectedPublishers.map(p => p.id)

        // Auxiliar: verifica se um publicador tem pelo menos um parceiro compatível no restante dos candidatos
        const hasCompatiblePartnerAvailable = (c: typeof eligiblePublishers[0]) => {
          return candidates.some(other => other.id !== c.id && areGendersCompatible(c, other))
        }

        candidates.sort((a, b) => {
          // 1. MENOS DESIGNAÇÕES NO PERÍODO ATUAL (Equilíbrio e rodízio justo)
          // Todos os publicadores devem ser mesclados antes de qualquer um repetir
          const countA = periodCountMap.get(a.id) || 0
          const countB = periodCountMap.get(b.id) || 0
          if (countA !== countB) return countA - countB

          // 2. DIVERSIFICAÇÃO DE PARES / DUPLAS (EVITA REPETIR OS MESMOS IRMÃOS JUNTOS)
          // Se já há alguém selecionado para este horário, quem nunca foi par dele tem prioridade máxima
          if (currentSelectedIds.length > 0) {
            const pairPenaltyA = getPairPenalty(a.id, currentSelectedIds, pairCountMap)
            const pairPenaltyB = getPairPenalty(b.id, currentSelectedIds, pairCountMap)
            if (pairPenaltyA !== pairPenaltyB) return pairPenaltyA - pairPenaltyB
          }

          // 3. SE ESTIVER ESCOLHENDO O 1º PUBLICADOR DE UMA VAGA DUPLA:
          // Prioriza quem tem parceiro compatível por gênero/família disponível para não deixar o slot incompleto
          if (currentSelectedPublishers.length === 0 && neededCount >= 2) {
            const partnerA = hasCompatiblePartnerAvailable(a) ? 1 : 0
            const partnerB = hasCompatiblePartnerAvailable(b) ? 1 : 0
            if (partnerA !== partnerB) return partnerB - partnerA
          }

          // 4. PREFERÊNCIA POR ESTE HORÁRIO (Entre quem tem a mesma quantidade de saídas e mesma novidade de dupla)
          const aHasPref = publisherSlotPreferences.get(a.id)?.has(slot.id) ? 1 : 0
          const bHasPref = publisherSlotPreferences.get(b.id)?.has(slot.id) ? 1 : 0
          if (aHasPref !== bHasPref) return bHasPref - aHasPref

          // 5. GRAU DE RESTRIÇÃO / FLEXIBILIDADE (Quem tem MENOS opções de horários entra primeiro quando o horário dele estiver disponível)
          const aSlotOptions = publisherSlotPreferences.get(a.id)?.size || 999
          const bSlotOptions = publisherSlotPreferences.get(b.id)?.size || 999
          if (aSlotOptions !== bSlotOptions) return aSlotOptions - bSlotOptions

          // 6. HISTÓRICO PASSADO INDIVIDUAL (Quem está há mais tempo sem participar tem prioridade)
          const lastA = lastAssignedDateMap.get(a.id)
          const lastB = lastAssignedDateMap.get(b.id)
          if (!lastA && lastB) return -1
          if (lastA && !lastB) return 1
          if (lastA && lastB) {
            const diff = dayjs(lastA).valueOf() - dayjs(lastB).valueOf()
            if (diff !== 0) return diff
          }

          // 7. DESEMPATE BALANCEADO POR DATA
          const hashA = stringHash(a.id + date + slot.id + slotPos)
          const hashB = stringHash(b.id + date + slot.id + slotPos)
          return hashA - hashB
        })

        const chosen = candidates[0]
        selected.push(chosen)
        currentSelectedPublishers.push(chosen)
        assignedOnDate.add(chosen.id)
      }

      if (selected.length === 0) continue

      // Cria ou atualiza assignment
      if (!existingAssignment) {
        existingAssignment = publicWitnessAssignmentRepository.create({
          time_slot_id: slot.id,
          date
        })
        await publicWitnessAssignmentRepository.save(existingAssignment)
      }

      for (let i = 0; i < selected.length; i++) {
        const pub = selected[i]
        const order = currentPublishers.length + i + 1

        const assignmentPub = publicWitnessAssignmentPublisherRepository.create({
          assignment_id: existingAssignment.id,
          publisher_id: pub.id,
          order
        })
        await publicWitnessAssignmentPublisherRepository.save(assignmentPub)

        periodCountMap.set(pub.id, (periodCountMap.get(pub.id) || 0) + 1)
        lastAssignedDateMap.set(pub.id, date)
        totalAssignmentsCreated++
      }

      // Registra a nova dupla no pairCountMap para não repeti-la no futuro
      const allInSlot = [...currentPublishers, ...selected.map(s => s.id)]
      for (let i = 0; i < allInSlot.length; i++) {
        for (let j = i + 1; j < allInSlot.length; j++) {
          const key = getPairKey(allInSlot[i], allInSlot[j])
          pairCountMap.set(key, (pairCountMap.get(key) || 0) + 1)
        }
      }
    }
  }

  return {
    message: "Programação de testemunho público gerada com sucesso!",
    totalAssignments: totalAssignmentsCreated,
    datesProcessed: validDates.length
  }
}
