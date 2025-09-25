import { AppDataSource } from "../data-source";
import { WeekendSchedule } from "../entities/WeekendSchedule";

export const weekendScheduleRepository = AppDataSource.getRepository(WeekendSchedule)