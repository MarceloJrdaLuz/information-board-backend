import { AppDataSource } from "../data-source";
import { PublicWitnessTimeSlotDefaultPublisher } from "../entities/PublicWitnessTimeSlotDefaultPublisher";

export const publicWitnessTimeSlotDefaultPublisherRepository = AppDataSource.getRepository(PublicWitnessTimeSlotDefaultPublisher)