import { AppDataSource } from "../data-source";
import { ExternalTalk } from "../entities/ExternalTalk";

export const externalTalkRepository = AppDataSource.getRepository(ExternalTalk)