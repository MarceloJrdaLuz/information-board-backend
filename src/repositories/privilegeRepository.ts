import { AppDataSource } from "../data-source";
import { Privilege } from "../entities/Privilege";

export const privilegeRepository = AppDataSource.getRepository(Privilege)