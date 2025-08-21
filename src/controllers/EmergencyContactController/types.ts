
export interface BodyEmergencyCreateTypes {
   name: string
   phone: string
   relationship?: string
   isTj?: boolean
   publisherId: string
}

export type BodyUpdateEmergencyContactTypes = BodyEmergencyCreateTypes

export type ParamsListEmergencyContactsTypes = {
   congregation_id: string
}

export type ParamsUpdateEmergencyContactsTypes = {
   emergencyContact_id: string
}

export type ParamsDeleteEmergencyContactsTypes = ParamsUpdateEmergencyContactsTypes
