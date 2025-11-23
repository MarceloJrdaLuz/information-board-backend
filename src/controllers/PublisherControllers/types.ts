import { Gender, Hope, Situation } from "../../entities/Publisher";
import { Privileges } from "../../types/privileges";

export type ParamsPublisherDeleteAndUpdateTypes = {
    publisher_id: string
}
export type ParamsGetPublishersTypes = {
    congregation_id: string
}

export type ParamsGetPublishersWithCongregationNumberTypes = {
    congregationNumber: string
}

export type ParamsGetPublisherTypes = {
    publisher_id: string
}
export interface BodyPublisherCreateTypes {
    id: string
    fullName: string
    nickname?: string
    hope: Hope
    dateImmersed?: string
    birthDate?: string
    startPioneer?: string
    gender: Gender
    privileges?: Privileges[]
    pioneerMonths: string[]
    congregation_id: string
    situation: Situation
    phone: string
    address: string
    emergencyContact_id?: string
}
export interface BodyPublisherUpdateTypes {
    fullName?: string
    nickname?: string
    dateImmersed?: string
    startPioneer?: string
    birthDate?: string
    privileges?: Privileges[]
    pioneerMonths: string[]
    hope: Hope
    gender: Gender
    situation?: Situation
    phone?: string
    address?: string
    emergencyContact_id?: string
}

export type ParamsPublisherUpdateTypes = {
    publisher_id: string
}

export type ParamsUnLinkPublisherToUserTypes = {
    publisher_id: string
}
