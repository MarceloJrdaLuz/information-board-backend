import { Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { Privileges } from "../../types/privileges";

export interface CustomRequest<T> extends Request {
    body: T
}

export interface ParamsCustomRequest<P extends ParamsDictionary> extends Request {
    params: P
}

export type ParamsPublisherDeleteTypes = {
    publisher_id: string
}

export interface BodyPublisherCreateTypes {
    id: string
    fullName: string
    nickname?: string
    privileges?: Privileges[] 
    congregation_id: string
}
export interface BodyPublisherUpdateTypes {
    id: string
    fullName?: string
    nickname?: string
    privileges?: Privileges[] 
}

