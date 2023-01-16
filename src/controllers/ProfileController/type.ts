import { Request } from "express";

export interface CustomRequest<T> extends Request {
    body: T
}

export interface BodyProfileCreateTypes {
    name: string
    lastName: string
    userId: number
    congregationId: number
}

export interface BodyProfileDeleteTypes{
    id: string
}

export interface BodyUpdateProfilesTypes {
    id: string
    name: string
    lastName: string
    congregationId: string
}

