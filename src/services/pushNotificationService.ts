import webpush from "web-push"
import { config } from "../config"
import { Notification, NotificationType } from "../entities/Notification"
import { notificationRepository } from "../repositories/notificationRepository"
import { pushSubscriptionRepository } from "../repositories/pushSubscriptionRepository"
import { userRepository } from "../repositories/userRepository"

export interface PushPayload {
    title: string
    body: string
    type?: NotificationType
    data?: Record<string, any>
    scheduled_at?: Date | null
}

class PushNotificationService {
    private isConfigured = false

    constructor() {
        this.init()
    }

    private init() {
        if (config.vapid_public_key && config.vapid_private_key) {
            webpush.setVapidDetails(
                config.vapid_subject || "mailto:contato@informationboard.com",
                config.vapid_public_key,
                config.vapid_private_key
            )
            this.isConfigured = true
        } else {
            console.warn("⚠️ VAPID keys are not configured. Web Push notifications will be disabled.")
        }
    }

    public getPublicKey(): string {
        return config.vapid_public_key
    }

    public isPushAvailable(): boolean {
        return this.isConfigured
    }

    /**
     * Envia notificação push para um usuário e salva no histórico do banco de dados
     */
    public async sendToUser(
        userId: string,
        payload: PushPayload
    ): Promise<{ notification: Notification; sentCount: number; failedCount: number }> {
        // 1. Salva notificação no banco
        const notification = notificationRepository.create({
            user_id: userId,
            title: payload.title,
            body: payload.body,
            type: payload.type || NotificationType.REMINDER,
            data: payload.data || null,
            scheduled_at: payload.scheduled_at || null,
            sent_at: new Date(),
        })

        const savedNotification = await notificationRepository.save(notification)

        let sentCount = 0
        let failedCount = 0

        if (!this.isConfigured) {
            return { notification: savedNotification, sentCount, failedCount }
        }

        // 2. Busca todas as inscrições ativas do usuário
        const subscriptions = await pushSubscriptionRepository.find({
            where: { user_id: userId },
        })

        if (!subscriptions || subscriptions.length === 0) {
            return { notification: savedNotification, sentCount, failedCount }
        }

        const pushData = JSON.stringify({
            title: payload.title,
            body: payload.body,
            badge: "/icons/badge.png",
            data: {
                ...payload.data,
                id: savedNotification.id,
                type: payload.type,
                url: payload.data?.url || "/dashboard",
            },
        })

        // 3. Dispara para cada dispositivo do usuário
        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth,
                        },
                    },
                    pushData
                )
                sentCount++
            } catch (err: any) {
                failedCount++
                console.error(`Erro ao enviar push para subscription ${sub.id}:`, err?.message || err)

                // Se a inscrição expirou ou não existe mais no browser (404 / 410), removemos do banco
                if (err?.statusCode === 404 || err?.statusCode === 410) {
                    console.log(`Removendo subscription expirada: ${sub.id}`)
                    await pushSubscriptionRepository.delete({ id: sub.id })
                }
            }
        }

        return { notification: savedNotification, sentCount, failedCount }
    }

    /**
     * Envia notificação push para o usuário vinculado a um publicador
     */
    public async sendToPublisher(
        publisherId: string,
        payload: PushPayload
    ): Promise<{ notification?: Notification; sentCount: number; failedCount: number } | null> {
        const user = await userRepository.findOne({
            where: { publisher: { id: publisherId } },
        })

        if (!user) {
            return null
        }

        return this.sendToUser(user.id, payload)
    }

    /**
     * Envia notificação para uma lista de publicadores
     */
    public async sendToPublishers(
        publisherIds: string[],
        payload: PushPayload
    ): Promise<void> {
        const uniqueIds = Array.from(new Set(publisherIds.filter(Boolean)))
        for (const publisherId of uniqueIds) {
            try {
                await this.sendToPublisher(publisherId, payload)
            } catch (error) {
                console.error(`Erro ao enviar push para publicador ${publisherId}:`, error)
            }
        }
    }
}

export const pushNotificationService = new PushNotificationService()
