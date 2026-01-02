import { AppDataSource } from "../data-source";
import { PublicWitnessTimeSlot } from "../entities/PublicWitnessTimeSlot";

export const publicWitnessTimeSlotRepository = AppDataSource.getRepository(PublicWitnessTimeSlot)
