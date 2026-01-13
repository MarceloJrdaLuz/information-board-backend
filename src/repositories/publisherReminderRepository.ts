import { AppDataSource } from "../data-source";
import { PublisherReminder } from "../entities/PublisherReminders";

export const publisherReminderRepository = AppDataSource.getRepository(PublisherReminder)