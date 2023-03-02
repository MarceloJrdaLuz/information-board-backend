import { Request } from "express";

export interface CustomRequest<T> extends Request {
    body: T
}

export interface BodyUserCreateTypes {
    email: string
    password: string
    roles: string[]
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

export interface BodyRecoverUserInformationTypes {
    token: string
}
