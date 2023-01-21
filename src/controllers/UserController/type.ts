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
    roles: string[]
}
