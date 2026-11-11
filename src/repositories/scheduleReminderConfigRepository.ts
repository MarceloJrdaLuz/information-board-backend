import { AppDataSource } from "../data-source";
import { ScheduleReminderConfig } from "../entities/ScheduleReminderConfig";

export const scheduleReminderConfigRepository = AppDataSource.getRepository(ScheduleReminderConfig);
