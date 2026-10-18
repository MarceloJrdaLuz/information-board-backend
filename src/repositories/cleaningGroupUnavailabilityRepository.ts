import { AppDataSource } from "../data-source";
import { CleaningGroupUnavailability } from "../entities/CleaningGroupUnavailability";

export const cleaningGroupUnavailabilityRepository = AppDataSource.getRepository(CleaningGroupUnavailability);

