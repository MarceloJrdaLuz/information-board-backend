import { Request } from "express";

export interface CustomRequest<T> extends Request {
    body: T
}

export interface BodyCongregationCreateTypes {
    name: string
    number: string
    city: string
}
