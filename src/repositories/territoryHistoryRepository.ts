import { AppDataSource } from "../data-source";
import { TerritoryHistory } from "../entities/TerritoryHistory";

export const territoryHistoryRepository = AppDataSource.getRepository(TerritoryHistory)
