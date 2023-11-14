import { AppDataSource } from "../data-source";
import { MeetingAssistance } from "../entities/MeetingAssistance";

export const meetingAssistanceRepository = AppDataSource.getRepository(MeetingAssistance)