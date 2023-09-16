import { AppDataSource } from "../data-source";
import { Report } from "../entities/Report";

export const reportRepository = AppDataSource.getRepository(Report)
