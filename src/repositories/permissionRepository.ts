import { AppDataSource } from "../data-source";
import { Permission } from "../entities/Permission";

export const permissionRepository = AppDataSource.getRepository(Permission)