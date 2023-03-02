import { Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";

export interface CustomRequest<T> extends Request {
    body: T
}

export interface ParamsCustomRequest<P extends ParamsDictionary> extends Request {
    params: P
}

export interface BodyProfileCreateTypes {
    name: string
    lastName: string
    avatar_url?: string
    user_id: string
    congregation_id: string
}

export type ParamsProfileDeleteTypes = {
    id: string
}

export interface BodyUpdateProfilesTypes {
    id: string
    name?: string
    lastName?: string,
    avatar_url?: string
    congregation_id?: string
}

