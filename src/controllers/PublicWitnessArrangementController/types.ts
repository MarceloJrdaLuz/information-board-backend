export type ParamsArrangement = {
    arrangement_id: string
}

export type ParamsCongregation = {
    congregation_id: string
}

export interface BodyArrangementCreate {
    is_fixed: boolean
    weekday?: number | null
    date?: string | null
    title?: string | null
    timeSlots?: {
        start_time: string
        end_time: string
        order: number
        is_rotative: boolean
        defaultPublishers?: { publisher_id: string, order?: number }[]
    }[]
}

export interface BodyArrangementUpdate {
    is_fixed?: boolean
    weekday?: number | null
    date?: string | null
    title?: string | null
    timeSlots?: {
        id: string
        start_time: string
        end_time: string
        order: number
        is_rotative: boolean
        defaultPublishers?: { publisher_id: string, order?: number }[]
    }[]
}

