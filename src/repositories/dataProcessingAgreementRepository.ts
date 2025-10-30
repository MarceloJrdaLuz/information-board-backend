import { AppDataSource } from "../data-source";
import { DataProcessingAgreement } from "../entities/DataProcessingAgreement";

export const agreementRepository = AppDataSource.getRepository(DataProcessingAgreement)
