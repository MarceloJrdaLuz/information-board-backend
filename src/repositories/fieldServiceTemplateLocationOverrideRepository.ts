import { AppDataSource } from "../data-source";
import { FieldServiceTemplateLocationOverride } from "../entities/FieldServiceTemplateLocationOverride";

export const fieldServiceTemplateLocationOverrideRepository = AppDataSource.getRepository(FieldServiceTemplateLocationOverride)