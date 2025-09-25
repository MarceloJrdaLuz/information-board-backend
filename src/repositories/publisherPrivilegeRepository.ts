import { AppDataSource } from "../data-source";
import { PublisherPrivilege } from "../entities/PublisherPrivilege";

export const publisherPrivilegeRepository = AppDataSource.getRepository(PublisherPrivilege)