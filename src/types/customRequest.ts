import { Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";

export interface CustomRequest<T> extends Request {
    body: T
}

export interface ParamsCustomRequest<P extends ParamsDictionary> extends Request {
    params: P
}

export interface CustomRequestPT<P extends ParamsDictionary, T> extends Request {
    params: P;
    body: T;
}

export interface QueryCustomRequest<P extends ParamsDictionary> extends Request {
    params: P
}