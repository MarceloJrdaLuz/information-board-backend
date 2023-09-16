import { AppDataSource } from "../data-source";
import { Congregation } from "../entities/Congregation";

export const congregationRepository = AppDataSource.getRepository(Congregation)