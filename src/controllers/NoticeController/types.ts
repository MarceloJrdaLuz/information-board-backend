export interface BodyNoticeCreateTypes {
    title: string
    text: string
    expired?: Date
    startDay?: number
    endDay?: number
}
export interface BodyNoticeUpdateTypes {
    title?: string
    text?: string
    expired?: Date
    startDay?: number
    endDay?: number
}

export type ParamsNoticeCreateTypes = {
    congregation_id: string
}

export type ParamsNoticeUpdateTypes = {
   notice_id: string
}

