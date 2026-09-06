import { AppDataSource } from "../data-source";
import { MidweekWorkbookWeek } from "../entities/MidweekWorkbookWeek";

export const midweekWorkbookWeekRepository = AppDataSource.getRepository(MidweekWorkbookWeek);
