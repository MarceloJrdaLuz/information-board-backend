import { Request } from "express";

export interface CustomRequest<T> extends Request {
    body: T
}

export interface BodyUserCreateTypes {
    email: string
    password: string
}

export interface BodyUserLoginTypes {
    email: string
    password: string
    congregation: string
}
