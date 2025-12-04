import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
dayjs.extend(isoWeek);

export const midweekDayMap: Record<string, number> = {
    "Segunda-feira": 1,
    "Terça-feira": 2,
    "Quarta-feira": 3,
    "Quinta-feira": 4,
    "Sexta-feira": 5,
};

export const endweekDayMap: Record<string, number> = {
    "Sexta-feira": 5,
    "Sábado": 6,
    "Domingo": 7,
};

export function convertMeetingDayPortugueseToIso(day: string): number {
    return midweekDayMap[day] ?? endweekDayMap[day] ?? 1;
}
