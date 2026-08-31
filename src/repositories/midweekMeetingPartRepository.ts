import { AppDataSource } from "../data-source";
import { MidweekMeetingPart } from "../entities/MidweekMeetingPart";

export const midweekMeetingPartRepository = AppDataSource.getRepository(MidweekMeetingPart);
