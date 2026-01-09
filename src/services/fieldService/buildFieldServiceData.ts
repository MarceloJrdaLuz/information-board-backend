import { Between, In } from "typeorm"
import dayjs from "dayjs"
import {
  FieldServicePdfResponse,
  RotationBlockPdf,
} from "../../controllers/FieldServiceScheduleController/types"
import { congregationRepository } from "../../repositories/congregationRepository"
import { fieldServiceExceptionRepository } from "../../repositories/fieldServiceExceptionRepository"
import { fieldServiceTemplateRepository } from "../../repositories/fieldServiceTemplateRepository"
import { fieldServiceScheduleRepository } from "../../repositories/fieldServiceScheduleRepository"

/* ===================== CONSTANTS ===================== */

const WEEKDAY_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
}

const FIELD_SERVICE_WEEKDAY_ORDER: Record<number, number> = {
  6: 0, // Sábado
  0: 1, // Domingo
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6,
}

const weekdayLabel = (weekday: number) =>
  WEEKDAY_LABELS[weekday] ?? "—"

/* ===================== SERVICE ===================== */

export async function buildFieldServiceData(
  congregation_id: string,
  start: Date,
  end: Date
): Promise<FieldServicePdfResponse> {
  const startStr = dayjs(start).format("YYYY-MM-DD")
  const endStr = dayjs(end).format("YYYY-MM-DD")

  /* ===== Congregação ===== */
  const congregation = await congregationRepository.findOneByOrFail({
    id: congregation_id,
  })

  /* ===== Templates ativos ===== */
  const templates = await fieldServiceTemplateRepository.find({
    where: { congregation: { id: congregation_id } },
    relations: ["leader", "location_overrides"],
  });

  /* ===== Exceptions do período ===== */
  const exceptions = await fieldServiceExceptionRepository.find({
    where: {
      congregation_id,
      date: Between(startStr, endStr),
    },
  })

  const exceptionMap = new Map<string, string | undefined>()
  exceptions.forEach(e => {
    exceptionMap.set(e.date, e.reason)
  })

  /* ===================== FIXED ===================== */
  const fixedSchedules = templates
    .filter(t => t.type === "FIXED")
    .map(t => ({
      weekday: weekdayLabel(t.weekday),
      weekdayIndex: t.weekday,
      time: t.time.slice(0, 5),
      leader: t.leader?.nickname ? t.leader.nickname : t.leader?.fullName ?? "—",
      location: t.location,
      locationRotation: t.location_overrides.length > 0,
      locationOverrides: t.location_overrides.map(o => ({
        weekStart: o.week_start,
        location: o.location,
      })),
    })).sort((a, b) => {
      const dayDiff =
        FIELD_SERVICE_WEEKDAY_ORDER[a.weekdayIndex] -
        FIELD_SERVICE_WEEKDAY_ORDER[b.weekdayIndex]

      if (dayDiff !== 0) return dayDiff

      return a.time.localeCompare(b.time)
    })


  /* ===================== ROTATION ===================== */
  const rotationTemplates = templates.filter(t => t.type === "ROTATION")
  const templateIds = rotationTemplates.map(t => t.id)

  const schedules = await fieldServiceScheduleRepository.find({
    where: {
      template: {
        id: In(templateIds),
      },
      date: Between(startStr, endStr),
    },
    relations: ["leader", "template"],
    order: { date: "ASC" },
  })

  const rotationBlocksMap = new Map<string, RotationBlockPdf>()

  // Criar blocos para cada template ROTATION
  for (const template of rotationTemplates) {
    const key = `${template.weekday}-${template.time}-${template.location}`
    if (!rotationBlocksMap.has(key)) {
      rotationBlocksMap.set(key, {
        title: `${weekdayLabel(template.weekday)} – ${template.time.slice(
          0,
          5
        )} – ${template.location}`,
        weekday: template.weekday,
        time: template.time.slice(0, 5),
        location: template.location,
        schedules: [],
      })
    }
  }
  // Preencher os blocos com agendamentos existentes
  for (const schedule of schedules) {
    const template = schedule.template
    const key = `${template.weekday}-${template.time}-${template.location}`
    const exceptionReason = exceptionMap.get(schedule.date)

    rotationBlocksMap.get(key)!.schedules.push({
      date: schedule.date,
      leader: schedule.leader?.nickname ? schedule.leader.nickname : schedule.leader?.fullName ?? "—",
      exceptionReason: exceptionReason,
    })
  }

  // Incluir exceções que não têm agendamento
  exceptions.forEach(e => {
    const dayOfWeek = dayjs(e.date).day()
    rotationTemplates.forEach(template => {
      if (template.weekday === dayOfWeek) {
        const key = `${template.weekday}-${template.time}-${template.location}`
        const block = rotationBlocksMap.get(key)
        if (!block) return

        const alreadyExists = block.schedules.some(s => s.date === e.date)
        if (!alreadyExists) {
          block.schedules.push({
            date: e.date,
            leader: template.leader?.nickname ? template.leader.nickname : template.leader?.fullName ?? "—",
            exceptionReason: e.reason,
          })
        }
      }
    })
  })

  // Ordenar cada bloco por data
  rotationBlocksMap.forEach(block => {
    block.schedules.sort((a, b) => (a.date < b.date ? -1 : 1))
  })


  const rotationBlocks = Array.from(rotationBlocksMap.values()).sort((a, b) => {
    const dayDiff =
      FIELD_SERVICE_WEEKDAY_ORDER[a.weekday] -
      FIELD_SERVICE_WEEKDAY_ORDER[b.weekday]

    if (dayDiff !== 0) return dayDiff

    return a.time.localeCompare(b.time)
  })


  return {
    congregationName: congregation.name,
    period: {
      start: startStr,
      end: endStr,
    },
    fixedSchedules,
    rotationBlocks,
  }
}
