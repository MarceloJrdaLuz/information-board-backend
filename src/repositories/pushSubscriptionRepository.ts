import { AppDataSource } from "../data-source"
import { PushSubscription } from "../entities/PushSubscription"

export const pushSubscriptionRepository = AppDataSource.getRepository(PushSubscription)
