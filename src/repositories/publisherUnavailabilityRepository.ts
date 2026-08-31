import { AppDataSource } from "../data-source";
import { PublisherUnavailability } from "../entities/PublisherUnavailability";

export const publisherUnavailabilityRepository = AppDataSource.getRepository(PublisherUnavailability);
