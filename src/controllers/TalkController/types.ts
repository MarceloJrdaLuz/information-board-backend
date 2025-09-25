import { Talk } from "../../helpers/allTalks"

// --- PARAMS ---
export type ParamsTalkTypes = {
  talk_id: string
}

// --- BODY CREATE ---
export type BodyTalkCreateTypes = {
  number: number
  title: string
}

// --- BODY UPDATE ---
export type BodyTalkUpdateTypes = {
  number?: number
  title?: string
}

export type BodyTalkImportTypes = {
  talks: Talk[]
}