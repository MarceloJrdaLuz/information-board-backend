import { Months } from "../../types/enumWeekDays"

export interface BodyMeetingAssistanceCreateTypes {
    month: string
    year: string
    midWeek: string[]
    midWeekTotal: number
    midWeekAverage: number
    endWeek: string[]
    endWeekTotal: number
    endWeekAverage: number
}

export type ParamsMeetingAssistanceCreateTypes = {
    congregation_id: string
}
