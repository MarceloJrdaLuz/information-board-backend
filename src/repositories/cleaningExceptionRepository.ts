import { AppDataSource } from "../data-source";
import { CleaningException } from "../entities/CleaningException";

export const cleaningExceptionRepository = AppDataSource.getRepository(CleaningException)