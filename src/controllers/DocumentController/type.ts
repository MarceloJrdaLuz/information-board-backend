import { Request } from "express";

export interface CustomRequest<T> extends Request {
    body: T
}

export interface BodyDocumentsCreateTypes {
    fileName: string
    size: number
    key: string
    url: string
    category_id: string
    congregation_id: string
}

export interface BodyDocumentsFilterTypes {
    congregation_id: string
}

