import { AppDataSource } from "../data-source";
import { Notification } from "../entities/Notification";

export const notificationRepository = AppDataSource.getRepository(Notification)