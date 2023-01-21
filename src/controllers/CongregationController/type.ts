import { Request } from "express";
import { ParamsDictionary, Query } from "express-serve-static-core";

export interface BodyCustomRequest<T> extends Request {
    body: T
}

export interface QueryCustomRequest<P extends ParamsDictionary> extends Request {
    params: P
}


export interface BodyCongregationCreateTypes {
    name: string
    number: string
    city: string
}

export type QueryCongregationDeleteTypes =  {
    id : string
}
