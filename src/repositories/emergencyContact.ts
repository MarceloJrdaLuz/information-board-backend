import { AppDataSource } from "../data-source";
import { EmergencyContact } from "../entities/EmergencyContact";

export const emergencyContactRepository = AppDataSource.getRepository(EmergencyContact)

