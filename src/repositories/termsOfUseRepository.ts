import { AppDataSource } from "../data-source";
import { TermsOfUse } from "../entities/TermsOfUse";

export const termsRepository = AppDataSource.getRepository(TermsOfUse)
