import { AppDataSource } from "../data-source";
import { Notice } from "../entities/Notice";

export const noticeRepository = AppDataSource.getRepository(Notice)