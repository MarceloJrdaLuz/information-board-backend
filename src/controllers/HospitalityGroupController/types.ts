// ================ Params ===================
export type ParamsHospitalityGroupTypes = {
  hospitalityGroup_id: string
}

export type ParamsGetHospitalityGroupsTypes = {
  congregation_id: string
}

export type ParamsCreateHospitalityGroupTypes = ParamsGetHospitalityGroupsTypes

// ================ Body ===================
export interface BodyHospitalityGroupCreateTypes {
  name: string
  publisherHost_id?: string
  next_reception?: Date
  member_ids?: string[]
}


export interface BodyHospitalityGroupUpdateTypes {
  name: string
  publisherHost_id?: string
  next_reception?: Date
  member_ids?: string[]
}

export interface BodyReorderGroupsTypes {
  orderedGroupIds: string[]
}