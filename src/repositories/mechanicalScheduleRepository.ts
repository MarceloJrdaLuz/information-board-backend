import { AppDataSource } from "../data-source";
import { MechanicalSchedule } from "../entities/MechanicalSchedule";

export const mechanicalScheduleRepository = AppDataSource.getRepository(MechanicalSchedule);

