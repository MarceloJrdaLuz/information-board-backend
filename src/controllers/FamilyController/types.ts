export type ParamsFamilyCreate = {
    congregation_id: string;
}

export interface BodyFamilyCreate {
    name: string;
    responsible_publisher_id?: string | null;
    memberIds?: string[];
}

export type ParamsFamilyUpdate = {
    family_id: string;
}

export interface BodyFamilyUpdate {
    name?: string;
    responsible_publisher_id?: string | null;
    memberIds?: string[];
}

export type ParamsGetFamily = {
    family_id: string;
}

export type ParamsGetFamilies = {
    congregation_id: string;
}

export type ParamsDeleteFamily = {
    family_id: string;
}
