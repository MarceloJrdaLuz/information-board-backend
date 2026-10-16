import { AppDataSource } from "../data-source";
import { PasskeyCredential } from "../entities/PasskeyCredential";

export const passkeyCredentialRepository = AppDataSource.getRepository(PasskeyCredential);

