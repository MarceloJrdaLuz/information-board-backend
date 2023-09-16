import { AppDataSource } from "../data-source";
import { ConsentRecord } from "../entities/ConsentRecord";

export const consentRecordRepository = AppDataSource.getRepository(ConsentRecord)
