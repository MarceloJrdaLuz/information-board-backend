import { Request, RequestParamHandler } from "express";

export interface CustomRequest<T> extends Request {
    body: T
}
// export interface CustomParamsRequest<P> extends RequestParamHandler {
//     params: P
// }

export interface BodyNoticeCreateTypes {
    title: string
    text: string
}

export interface BodyNoticeCreateTypes {
    title: string
    text: string
}
