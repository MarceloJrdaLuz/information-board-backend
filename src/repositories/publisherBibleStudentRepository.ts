import { AppDataSource } from "../data-source";
import { PublisherBibleStudent } from "../entities/PublisherBibleStudent";

export const publisherBibleStudentRepository = AppDataSource.getRepository(PublisherBibleStudent);
