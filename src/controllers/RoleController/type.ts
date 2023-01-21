import { Request } from "express";

export interface CustomRequest<T> extends Request {
    body: T
}

export interface BodyRoleCreateTypes {
    name: string
    description: string
    permissions: string[]
}
