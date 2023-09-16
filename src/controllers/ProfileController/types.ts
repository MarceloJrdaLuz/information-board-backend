export interface BodyProfileCreateTypes {
    name: string
    lastName: string
    avatar_url?: string
    user_id: string
}

export type ParamsProfileDeleteTypes = {
    id: string
}

export interface BodyUpdateProfilesTypes {
    id: string
    name?: string
    lastName?: string,
    avatar_url?: string
}



