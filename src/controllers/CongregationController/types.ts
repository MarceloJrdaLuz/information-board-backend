import { CongregationType } from "../../entities/Congregation";
import { EndweekDays, MidweekDays } from "../../types/enumWeekDays";

export interface BodyCongregationCreateTypes {
    name: string
    number: string
    city: string
    circuit: string
    image_url?: string
}
export interface BodyAuxiliaryCongregationCreateTypes {
    name: string
    number: string
    city: string
    circuit: string
    dayMeetingPublic: EndweekDays
    hourMeetingPublic: string
}
export type BodyAuxiliaryCongregationUpdateTypes = Partial<BodyAuxiliaryCongregationCreateTypes>
export interface BodyCongregationUpdateTypes {
    name?: string
    city?: string
    circuit?: string
    dayMeetingLifeAndMinistary?: MidweekDays
    dayMeetingPublic?: EndweekDays
    hourMeetingLifeAndMinistary?: string
    hourMeetingPublic?: string
    type?: CongregationType
}

export type ParamsUpdateCongregationTypes = {
    congregation_id: string
}

export type QueryCongregationDeleteTypes = {
    id: string
}

export type ParamsCongregationDeleteTypes = {
    congregation_id: string
}

export type QueryGetCongregationTypes = {
    number: string
}


