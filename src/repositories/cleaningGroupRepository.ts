import { AppDataSource } from "../data-source";
import { CleaningGroup } from "../entities/CleaningGroup";

export const cleaningGroupRepository = AppDataSource.getRepository(CleaningGroup)