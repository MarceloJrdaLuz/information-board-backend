import { Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";

export interface CustomRequest<T> extends Request {
    body: T
}

export interface ParamsCustomRequest<P extends ParamsDictionary> extends Request {
    params: P
}

export interface BodyDocumentsCreateTypes {
    fileName: string
    size: number
    key: string
    url: string
    category_id: string
    congregation_id: string
    user_id: string
}

export type ParamsDocumentsFilterTypes = {
    congregation_id: string
}

export type ParamsDocumentDeleteTypes = {
    document_id: string
}


