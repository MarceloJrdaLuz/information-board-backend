import { AppDataSource } from "../data-source";
import { Talk } from "../entities/Talk";

export const talkRepository = AppDataSource.getRepository(Talk)