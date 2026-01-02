import { AppDataSource } from "../data-source";
import { PublicWitnessAssignment } from "../entities/PublicWitnessAssignment";

export const publicWitnessAssignmentRepository = AppDataSource.getRepository(PublicWitnessAssignment)
