import { Request } from "express";

export interface CustomRequest<T> extends Request {
    body: T
}

export interface BodyCategoryCreateTypes {
   name: string
   description: string
}

