export type ParamsWeekendScheduleTypes = {
    weekendSchedule_id: string
}

export type ParamsGetWeekendScheduleTypes = {
    congregation_id: string
}

export type ParamsWeekendScheduleCreateTypes = ParamsGetWeekendScheduleTypes


export interface WeekendSchedule {
    id: string
    date: string
    speaker_id?: string
    talk_id?: string
    chairman_id?: string
    reader_id?: string
    hospitalityGroup_id?: string
    isSpecial?: boolean
    specialName?: string 
    manualTalk?: string 
    manualSpeaker?: string
    watchTowerStudyTitle?: string
}
export type BodyWeekendScheduleCreateTypes = {
    schedules: WeekendSchedule[]
}

export interface BodyWeekendScheduleUpdateTypes {
    schedules: WeekendSchedule[]
}

export type BodyGenerateWeekendScheduleTypes = {
    dates: string[]
    congregation_id: string
}
