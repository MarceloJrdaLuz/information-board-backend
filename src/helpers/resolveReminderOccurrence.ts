import dayjs, { Dayjs, OpUnitType } from "dayjs"
import isBetween from "dayjs/plugin/isBetween"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore" // Importante adicionar este plugin
import { PublisherReminder, RecurrenceType } from "../entities/PublisherReminders"

dayjs.extend(isBetween)
dayjs.extend(isSameOrBefore)

interface ResolvedReminder {
  id: string
  title: string
  description?: string | null
  startDate: string
  endDate: string
  isRecurring: boolean
}

export function resolveReminderOccurrence(
  reminder: PublisherReminder,
  today: Dayjs = dayjs()
): ResolvedReminder | null {
  if (!reminder.isActive) return null

  const todayDay = today.startOf("day")
  const start = dayjs(reminder.startDate).startOf("day")
  
  // Duração calculada do evento original
  const durationDays = reminder.endDate 
    ? dayjs(reminder.endDate).diff(start, "day") + 1 
    : 1

  const completedUntil = reminder.completed_until ? dayjs(reminder.completed_until).startOf("day") : null

  // 1. NÃO RECORRENTE
  if (!reminder.isRecurring) {
    const end = start.add(durationDays - 1, "day")
    if (completedUntil && todayDay.isSameOrBefore(completedUntil)) return null
    if (!todayDay.isBetween(start, end, "day", "[]")) return null

    return {
      id: reminder.id,
      title: reminder.title,
      description: reminder.description,
      startDate: start.format("YYYY-MM-DD"),
      endDate: end.format("YYYY-MM-DD"),
      isRecurring: false
    }
  }

  // 2. RECORRENTE
  const interval = reminder.recurrenceInterval || 1
  const type = reminder.recurrenceType || RecurrenceType.DAILY

  // Mapeia o tipo para a unidade do Dayjs
  const unitMap: Record<RecurrenceType, dayjs.ManipulateType> = {
    [RecurrenceType.DAILY]: 'day',
    [RecurrenceType.WEEKLY]: 'week',
    [RecurrenceType.MONTHLY]: 'month',
    [RecurrenceType.YEARLY]: 'year'
  }
  const unit = unitMap[type]

  // Diferença na unidade específica
  const diff = todayDay.diff(start, unit)
  if (diff < 0) return null

  const cycleIndex = Math.floor(diff / interval)

  // Controle de quantidade
  if (reminder.recurrenceCount && (cycleIndex + 1) > reminder.recurrenceCount) return null

  // Projeta as datas do ciclo atual
  const cycleStart = start.add(cycleIndex * interval, unit)
  const cycleEnd = cycleStart.add(durationDays - 1, "day")

  // Se já concluído este ciclo
  if (completedUntil && cycleEnd.isSameOrBefore(completedUntil)) return null

  // Verifica se hoje está dentro da janela do ciclo
  if (!todayDay.isBetween(cycleStart, cycleEnd, "day", "[]")) return null

  return {
    id: reminder.id,
    title: reminder.title,
    description: reminder.description,
    startDate: cycleStart.format("YYYY-MM-DD"),
    endDate: cycleEnd.format("YYYY-MM-DD"),
    isRecurring: true
  }
}