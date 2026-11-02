import { AppDataSource } from "../data-source";
import { PublisherFieldActivity } from "../entities/PublisherFieldActivity";

export const publisherFieldActivityRepository = AppDataSource.getRepository(PublisherFieldActivity);
