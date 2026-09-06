import { AppDataSource } from "../data-source";
import { MechanicalScheduleConfig } from "../entities/MechanicalScheduleConfig";

export const mechanicalScheduleConfigRepository = AppDataSource.getRepository(MechanicalScheduleConfig);

