import { AppDataSource } from "../data-source";
import { PasskeyChallenge } from "../entities/PasskeyChallenge";

export const passkeyChallengeRepository = AppDataSource.getRepository(PasskeyChallenge);

