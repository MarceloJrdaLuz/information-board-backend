import { Gender, Hope } from "../../entities/Publisher";
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
    dateImmersed?: Date
    birthDate?: Date
    gender: Gender
    privileges?: Privileges[]
    congregation_id: string
}
export interface BodyPublisherUpdateTypes {
    id: string
    fullName?: string
    nickname?: string
    dateImmersed?: Date
    birthDate?: Date
    privileges?: Privileges[]
    hope: Hope
    gender: Gender
}

