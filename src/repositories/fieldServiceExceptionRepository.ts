import { AppDataSource } from "../data-source";
import { FieldServiceException } from "../entities/FieldServiceException";

export const fieldServiceExceptionRepository = AppDataSource.getRepository(FieldServiceException)