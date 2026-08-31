import { AppDataSource } from "../data-source";
import { PublisherMidweekQualification } from "../entities/PublisherMidweekQualification";

export const publisherMidweekQualificationRepository = AppDataSource.getRepository(PublisherMidweekQualification);
