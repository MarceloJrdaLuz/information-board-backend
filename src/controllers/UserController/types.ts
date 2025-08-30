export interface BodyUserCreateTypes {
    email: string
    password: string
    fullName: string
}

export interface BodyUserLoginTypes {
    email: string
    password: string
}

export interface BodyUserUpdateTypes {
    user_id: string
    congregation_id?: string // para um admin de congregacao fazer um update da role de um usuario ele tem que passar o id
    roles: string[]
}
export interface BodyResetPasswordTypes {
    email: string
    token: string // para um admin de congregacao fazer um update da role de um usuario ele tem que passar o id
    newPassword: string
}

export interface BodyAddDomainsTypes {
    user_code: string
    congregation_number: string
}

export type ParamsLinkPublisherToUserTypes = {
    user_id: string
}
export interface BodyLinkPublisherToUserTypes {
    publisher_id: string
    force: boolean
}

export type ParamsGetUsersByCongregationTypes = {
    congregation_id: string
}