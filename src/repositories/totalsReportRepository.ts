import { AppDataSource } from "../data-source";
import { TotalsReports } from "../entities/TotalsReports";

export const totalsReportsRepository = AppDataSource.getRepository(TotalsReports)