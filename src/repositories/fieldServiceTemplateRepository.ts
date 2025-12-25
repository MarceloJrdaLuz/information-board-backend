import { AppDataSource } from "../data-source";
import { FieldServiceTemplate } from "../entities/FieldServiceTemplate";

export const fieldServiceTemplateRepository = AppDataSource.getRepository(FieldServiceTemplate)