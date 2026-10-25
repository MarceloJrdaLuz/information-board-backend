import { AppDataSource } from "../data-source";
import { PublicWitnessArrangementPublisher } from "../entities/PublicWitnessArrangementPublisher";

export const publicWitnessArrangementPublisherRepository = AppDataSource.getRepository(PublicWitnessArrangementPublisher);

