import { AppDataSource } from "../data-source";
import { Document } from "../entities/Document";

export const documentRepository = AppDataSource.getRepository(Document)