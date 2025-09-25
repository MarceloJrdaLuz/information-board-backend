import { AppDataSource } from "../data-source";
import { Speaker } from "../entities/Speaker";

export const speakerRepository = AppDataSource.getRepository(Speaker)