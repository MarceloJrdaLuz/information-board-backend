import { AppDataSource } from "../data-source";
import { FieldServiceSchedule } from "../entities/FieldServiceSchedule";

export const fieldServiceScheduleRepository = AppDataSource.getRepository(FieldServiceSchedule)