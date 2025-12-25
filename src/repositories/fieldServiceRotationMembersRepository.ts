import { AppDataSource } from "../data-source";
import { FieldServiceRotationMember } from "../entities/FieldServiceRotationMember";

export const fieldServiceRotationMemberRepository = AppDataSource.getRepository(FieldServiceRotationMember)