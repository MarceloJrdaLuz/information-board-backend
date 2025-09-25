// --- PARAMS ---
export type ParamsSpeakerTypes = {
  speaker_id: string
}

export type ParamsGetSpeakerTypes = {
  congregation_id: string
}

// --- BODY CREATE ---
export type BodySpeakerCreateTypes = {
  fullName: string
  phone?: string
  address?: string
  originCongregation_id: string
  publisher_id?: string
  talk_ids?: string[]
}

// --- BODY UPDATE ---
export type BodySpeakerUpdateTypes = {
  fullName?: string
  phone?: string
  address?: string
  publisher_id?: string
  originCongregation_id?: string
  talk_ids?: string[]
}