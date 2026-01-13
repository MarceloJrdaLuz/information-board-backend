import dayjs, { Dayjs } from "dayjs"
import isBetween from "dayjs/plugin/isBetween"
import { PublisherReminder } from "../entities/PublisherReminders"

dayjs.extend(isBetween)

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
  const end = dayjs(reminder.endDate).startOf("day")
  const completedUntil = reminder.completed_until ? dayjs(reminder.completed_until).startOf("day") : null

  // Se já concluído até o fim do ciclo atual, não mostra
  if (completedUntil && todayDay.isSameOrBefore(completedUntil)) return null

  // duração INCLUSIVA (1–20 = 20 dias)
  const durationDays = end.diff(start, "day") + 1

  // =====================
  // 📌 NÃO RECORRENTE
  // =====================
  if (!reminder.isRecurring || !reminder.recurrenceIntervalDays) {
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

  // =====================
  // 📌 RECORRENTE
  // =====================
  const daysFromStart = todayDay.diff(start, "day")
  if (daysFromStart < 0) return null

  const cycleIndex = Math.floor(daysFromStart / reminder.recurrenceIntervalDays)

  // controle por quantidade
  if (
    typeof reminder.recurrenceCount === "number" &&
    cycleIndex + 1 > reminder.recurrenceCount
  ) {
    return null
  }

  const cycleStart = start.add(cycleIndex * reminder.recurrenceIntervalDays, "day")
  const cycleEnd = cycleStart.add(durationDays - 1, "day")

  // Se já concluído até o fim do ciclo atual
  if (completedUntil && cycleEnd.isSameOrBefore(completedUntil)) return null

  if (!todayDay.isBetween(cycleStart, cycleEnd, "day", "[]")) {
    return null
  }

  return {
    id: reminder.id,
    title: reminder.title,
    description: reminder.description,
    startDate: cycleStart.format("YYYY-MM-DD"),
    endDate: cycleEnd.format("YYYY-MM-DD"),
    isRecurring: true
  }
}
