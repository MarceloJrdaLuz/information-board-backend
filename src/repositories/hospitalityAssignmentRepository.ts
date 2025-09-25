import { AppDataSource } from "../data-source";
import { HospitalityAssignment } from "../entities/HospitalityAssignment";

export const hospitalityAssignmentRepository = AppDataSource.getRepository(HospitalityAssignment)