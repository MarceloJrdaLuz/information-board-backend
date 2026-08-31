import { AppDataSource } from "../data-source";
import { MidweekWorkbookPart } from "../entities/MidweekWorkbookPart";

export const midweekWorkbookPartRepository = AppDataSource.getRepository(MidweekWorkbookPart);
