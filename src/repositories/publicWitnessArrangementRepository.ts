import { AppDataSource } from "../data-source";
import { PublicWitnessArrangement } from "../entities/PublicWitnessArrangement";

export const publicWitnessArrangementRepository = AppDataSource.getRepository(PublicWitnessArrangement)