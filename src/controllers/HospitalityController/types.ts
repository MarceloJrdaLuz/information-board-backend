import { HospitalityEventType } from "../../types/hospitality"

export type BodyAssignmentCreateTypes = {
  eventType: HospitalityEventType
  group_id: string
}

export type BodyWeekendCreateTypes = {
  date: string
  assignments?: BodyAssignmentCreateTypes[]
}

export type BodyWeekendsBatchCreateTypes = {
  weekends: BodyWeekendCreateTypes[]
}

export type ParamsWeekendTypes = {
  weekend_id: string
}

export type ParamsAssignmentTypes = {
  assignment_id: string
}
