import { AppDataSource } from "../data-source";
import { HospitalityGroup } from "../entities/HospitalityGroup.";

export const hospitalityGroupRepository = AppDataSource.getRepository(HospitalityGroup)