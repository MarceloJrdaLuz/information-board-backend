import { Months } from "../../types/enumWeekDays"

export interface ITotalsReports {
    month: string
    year: string
    publishersActives: number
    quantity: number
    privileges: string
    hours?: number
    studies?: number
}

export interface BodyTotalsReportsCreateTypes {
    totals: ITotalsReports[]
}

export type ParamsTotalsReportsCreateTypes = {
    congregation_id: string
}
