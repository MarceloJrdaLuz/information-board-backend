import { AppDataSource } from "../data-source";
import { PublisherMonthBalance } from "../entities/PublisherMonthBalance";

export const publisherMonthBalanceRepository = AppDataSource.getRepository(PublisherMonthBalance);
