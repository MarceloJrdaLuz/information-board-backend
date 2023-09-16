import { AppDataSource } from "../data-source";
import { Publisher } from "../entities/Publisher";

export const publisherRepository = AppDataSource.getRepository(Publisher)
