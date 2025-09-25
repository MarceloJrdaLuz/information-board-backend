import { AppDataSource } from "../data-source";
import { HospitalityWeekend } from "../entities/HospitalityWeekend";

export const hospitalityWeekendRepository = AppDataSource.getRepository(HospitalityWeekend)