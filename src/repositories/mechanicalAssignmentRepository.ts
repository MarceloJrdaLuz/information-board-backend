import { AppDataSource } from "../data-source";
import { MechanicalAssignment } from "../entities/MechanicalAssignment";

export const mechanicalAssignmentRepository = AppDataSource.getRepository(MechanicalAssignment);

