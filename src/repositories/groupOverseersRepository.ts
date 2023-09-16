import { AppDataSource } from "../data-source";
import { GroupOverseers } from "../entities/GroupOverseers";

export const groupOverseersRepository = AppDataSource.getRepository(GroupOverseers)