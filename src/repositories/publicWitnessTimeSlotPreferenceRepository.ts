import { AppDataSource } from "../data-source";
import { PublicWitnessTimeSlotPreference } from "../entities/PublicWitnessTimeSlotPreference";

export const publicWitnessTimeSlotPreferenceRepository = AppDataSource.getRepository(PublicWitnessTimeSlotPreference);

