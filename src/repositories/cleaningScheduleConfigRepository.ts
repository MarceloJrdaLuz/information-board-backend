import { AppDataSource } from "../data-source";
import { CleaningScheduleConfig } from "../entities/CleaningScheduleConfig";

export const cleaningScheduleConfigRepository = AppDataSource.getRepository(CleaningScheduleConfig)