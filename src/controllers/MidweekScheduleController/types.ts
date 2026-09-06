import { MidweekRoom } from "../../entities/MidweekMeetingPart";
import { MidweekSpecialType } from "../../entities/MidweekSchedule";
import { MidweekPartType, MidweekSection } from "../../entities/MidweekWorkbookPart";

export interface ParamsCongregation {
    congregation_id: string;
}

export interface ParamsSchedule {
    congregation_id: string;
    schedule_id: string;
}

export interface ParamsPart {
    congregation_id: string;
    part_id: string;
}

export interface QueryGetMonthSchedules {
    year?: string;
    month?: string;
}

export interface BodyUpdateSchedule {
    meetingDate?: string;
    chairman_id?: string | null;
    opening_prayer_id?: string | null;
    closing_prayer_id?: string | null;
    aux_counselor_1_id?: string | null;
    aux_counselor_2_id?: string | null;
    cbs_conductor_id?: string | null;
    cbs_reader_id?: string | null;
    isSpecial?: boolean;
    specialType?: MidweekSpecialType;
    specialName?: string | null;
    notes?: string | null;
    songOpen?: number;
    songMiddle?: number;
    songEnd?: number;
}

export interface BodyUpdatePart {
    assigned_publisher_id?: string | null;
    assistant_publisher_id?: string | null;
    room?: MidweekRoom;
    title?: string;
    sourceMaterial?: string | null;
    timeMinutes?: number;
    lessonNumber?: number | null;
    studyPoint?: number | null;
    studyPointDescription?: string | null;
    brochure?: string | null;
    requiresAssistant?: boolean;
    method?: string | null;
    isActive?: boolean;
    isCompleted?: boolean;
    orderIndex?: number;
}

export interface BodyCreateCustomPart {
    section?: MidweekSection;
    partType?: MidweekPartType;
    title: string;
    sourceMaterial?: string | null;
    timeMinutes: number;
    method?: string | null;
    room?: MidweekRoom;
    requiresAssistant?: boolean;
    assigned_publisher_id?: string | null;
    assistant_publisher_id?: string | null;
    orderIndex?: number;
}
