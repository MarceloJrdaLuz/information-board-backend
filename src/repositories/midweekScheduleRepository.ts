import { AppDataSource } from "../data-source";
import { MidweekSchedule } from "../entities/MidweekSchedule";

export const midweekScheduleRepository = AppDataSource.getRepository(MidweekSchedule);
