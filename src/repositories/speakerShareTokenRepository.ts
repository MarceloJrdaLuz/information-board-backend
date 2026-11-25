import { AppDataSource } from "../data-source";
import { SpeakerShareToken } from "../entities/SpeakerShareToken";

export const speakerShareTokenRepository = AppDataSource.getRepository(SpeakerShareToken);
