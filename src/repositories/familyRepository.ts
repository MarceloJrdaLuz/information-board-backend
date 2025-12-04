import { AppDataSource } from "../data-source";
import { Family } from "../entities/Family";

export const familyRepository = AppDataSource.getRepository(Family);
