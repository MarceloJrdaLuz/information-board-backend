import { AppDataSource } from "../data-source";
import { Territory } from "../entities/Territory";

export const territoryRepository = AppDataSource.getRepository(Territory)
