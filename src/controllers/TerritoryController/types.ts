export type ParamsTerritoryCreateTypes = {
    congregation_id: string
}

export type ParamsTerritoryUpdateTypes = {
    territory_id: string
}

export type ParamsTerritoryDeleteTypes = ParamsTerritoryUpdateTypes

export type ParamsGetTerritoryTypes = ParamsTerritoryUpdateTypes

export interface BodyTerritoryCreateTypes {
    name: string
    number: string
    description: string
}

export type BodyTerritoryUpdateTypes = BodyTerritoryCreateTypes


