export interface BodyGroupCreateTypes {
    name: string
    number: string
    congregation_id: string
    publisher_id: string
}
export interface BodyAddPublishersGroupTypes {
   publishers_ids: string[]
}

export type ParamsGetGroupsTypes = {
    congregation_id: string
}

export type ParamsAddPublishersGroupTypes = {
   group_id: string
}



