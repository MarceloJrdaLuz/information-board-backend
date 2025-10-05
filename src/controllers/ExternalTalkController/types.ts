export interface BodyCreateExternalTalk {
  date: string
  speaker_id: string
  destinationCongregation_id: string
  talk_id?: string          // opcional, mas se não vier precisa ter manualTalk
  manualTalk?: string      // opcional, mas se não vier precisa ter talk_id
}

export interface BodyUpdateExternalTalk {
  date?: string
  speaker_id?: string
  destinationCongregation_id?: string
  talk_id?: string
  manualTalk?: string
  status?: "pending" | "confirmed" | "canceled"
}

export type QueryExternalTalkByPeriod = {
  start: string
  end: string
}

export interface BodyUpdateStatusExternalTalk {
  status?: "pending" | "confirmed" | "canceled"
}

export type ParamsExternalTalk = {
  externalTalk_id: string
}

export type ParamsGetExternalTalks = {
  congregation_id: string
}

export type ParamsCreateExternalTalks = {
  congregation_id: string
}

