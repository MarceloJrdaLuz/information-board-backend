import { AppDataSource } from "../data-source";
import { AccessRequest } from "../entities/AccessRequest";

export const accessRequestRepository = AppDataSource.getRepository(AccessRequest);

