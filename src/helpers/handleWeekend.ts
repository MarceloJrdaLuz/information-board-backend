import moment from "moment-timezone";
import { ExternalTalk } from "../entities/ExternalTalk";

export type DayMeetingPublic = "Sexta-feira" | "Sábado" | "Domingo"

export function getWeekendRange(localMeetingDate: string | Date) {
  const base = moment(localMeetingDate);

  const sunday = base.clone().isoWeekday(7);
  const saturday = sunday.clone().subtract(1, "day");
  const friday = sunday.clone().subtract(2, "days");

  return {
    friday: friday.format("YYYY-MM-DD"),
    saturday: saturday.format("YYYY-MM-DD"),
    sunday: sunday.format("YYYY-MM-DD"),
  };
}

export function filterExternalTalksForWeekend(externalTalks: ExternalTalk[], localDate: string) {
  const range = getWeekendRange(localDate);

  return externalTalks.filter(ext => {
    const d = moment(ext.date);
    return d.isBetween(range.friday, range.sunday, undefined, "[]"); // [] = inclusive
  });
}

export function isCurrentWeekend(scheduleDate: string) {
  const today = moment().startOf("day")
  const target = moment(scheduleDate, "YYYY-MM-DD").startOf("day")

  // Descobre o domingo do fim de semana alvo
  const targetSunday = target.clone().isoWeekday(7)

  // Descobre o domingo atual (do fim de semana de hoje)
  const currentSunday =
    today.isoWeekday() === 7
      ? today.clone()                 // Domingo: hoje ainda é parte do fim de semana atual
      : today.clone().isoWeekday(7)   // Outros dias: domingo da mesma semana ISO

  return targetSunday.isSame(currentSunday, "day")
}
