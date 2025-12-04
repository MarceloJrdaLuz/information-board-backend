import { AppDataSource } from "../data-source";
import { CleaningSchedule } from "../entities/CleaningSchedule";

export const cleaningScheduleRepository = AppDataSource.getRepository(CleaningSchedule)