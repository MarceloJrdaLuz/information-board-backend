export type ParamsCleaningGroupCreate = {
    congregation_id: string
}

export type BodyCleaningGroupCreate = {
    name: string
    publisherIds: string[]
    order: number
}

export type BodyCleaningGroupUpdate = Partial<BodyCleaningGroupCreate>

 
export type ParamsCleaningGroupUpdate = {
    group_id: string
}

export type ParamsGetCleaningGroup = ParamsCleaningGroupUpdate

export type ParamsDeleteCleaningGroup = ParamsCleaningGroupUpdate

export type ParamsGetCleaningGroups = ParamsCleaningGroupCreate