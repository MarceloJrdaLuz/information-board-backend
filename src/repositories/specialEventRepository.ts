import { AppDataSource } from "../data-source";
import { SpecialEvent } from "../entities/SpecialEvent";

export const specialEventRepository = AppDataSource.getRepository(SpecialEvent);
