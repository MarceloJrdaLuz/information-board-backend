import { Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";

export interface CustomRequest<T> extends Request {
    body: T
}

export interface ParamsCustomRequest<P extends ParamsDictionary> extends Request {
    params: P
}
export interface QueryCustomRequest<P extends ParamsDictionary> extends Request {
    params: P
}

export type ParamsDocumentsFilterTypes = {
    congregation_id: string
}
export type BodyDocumentsCreateTypes = {
    congregation_id: string,
    category_id: string
}

export type ParamsDocumentDeleteTypes = {
    document_id: string
}


