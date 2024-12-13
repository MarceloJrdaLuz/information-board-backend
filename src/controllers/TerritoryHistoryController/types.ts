export type ParamsTerritoryHistoryCreateTypes = {
    territory_id: string
}

export type ParamsTerritoryHistoryGetTypes = {
    congregation_id: string
}

export type ParamsTerritoryHistoryUpdateTypes = {
    territoryHistory_id: string
}

export type ParamsTerritoryHistoryDeleteTypes = ParamsTerritoryHistoryUpdateTypes

export type ParamsGetTerritoryHistoryTypes = ParamsTerritoryHistoryCreateTypes

export interface BodyTerritoryHistoryCreateTypes {
    caretaker: string
    work_type: string
    assignment_date: string
    completion_date: string
}

export type BodyTerritoryHistoryUpdateTypes = BodyTerritoryHistoryCreateTypes




