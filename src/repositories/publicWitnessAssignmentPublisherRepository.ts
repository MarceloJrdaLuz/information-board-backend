import { AppDataSource } from "../data-source";
import { PublicWitnessAssignmentPublisher } from "../entities/PublicWitnessAssignmentPublisher";

export const publicWitnessAssignmentPublisherRepository = AppDataSource.getRepository(PublicWitnessAssignmentPublisher)
