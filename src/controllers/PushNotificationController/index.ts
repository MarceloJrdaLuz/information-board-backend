import { Request, Response } from "express"
import { BadRequestError } from "../../helpers/api-errors"
import { decoder } from "../../middlewares/permissions"
import { pushSubscriptionRepository } from "../../repositories/pushSubscriptionRepository"
import { pushNotificationService } from "../../services/pushNotificationService"
import { NotificationType } from "../../entities/Notification"

class PushNotificationController {
    /**
     * Retorna a chave pública VAPID para registro no navegador
     */
    async getPublicKey(req: Request, res: Response) {
        const publicKey = pushNotificationService.getPublicKey()
        return res.json({ publicKey })
    }

    /**
     * Salva ou atualiza a inscrição push do usuário logado
     */
    async subscribe(req: Request, res: Response) {
        const user = await decoder(req)
        const { endpoint, keys, userAgent } = req.body

        if (!endpoint) {
            throw new BadRequestError("Endpoint is required")
        }

        if (!keys || !keys.p256dh || !keys.auth) {
            throw new BadRequestError("Keys (p256dh, auth) are required")
        }

        // Verifica se já existe a inscrição por endpoint
        let subscription = await pushSubscriptionRepository.findOne({
            where: { endpoint },
        })

        if (subscription) {
            subscription.user_id = user.id
            subscription.p256dh = keys.p256dh
            subscription.auth = keys.auth
            subscription.user_agent = userAgent || req.headers["user-agent"] || null
        } else {
            subscription = pushSubscriptionRepository.create({
                user_id: user.id,
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
                user_agent: userAgent || req.headers["user-agent"] || null,
            })
        }

        const saved = await pushSubscriptionRepository.save(subscription)

        return res.status(201).json({
            message: "Push subscription registered successfully",
            subscription: saved,
        })
    }

    /**
     * Remove a inscrição push informada para o usuário logado
     */
    async unsubscribe(req: Request, res: Response) {
        const user = await decoder(req)
        const { endpoint } = req.body

        if (!endpoint) {
            throw new BadRequestError("Endpoint is required")
        }

        await pushSubscriptionRepository.delete({
            endpoint,
            user_id: user.id,
        })

        return res.json({ message: "Push subscription removed successfully" })
    }

    /**
     * Retorna se o usuário possui inscrições ativas
     */
    async getStatus(req: Request, res: Response) {
        const user = await decoder(req)

        const count = await pushSubscriptionRepository.count({
            where: { user_id: user.id },
        })

        return res.json({
            isSubscribed: count > 0,
            subscriptionCount: count,
        })
    }

    /**
     * Envia uma notificação push de teste para o usuário logado
     */
    async testNotification(req: Request, res: Response) {
        const user = await decoder(req)

        const result = await pushNotificationService.sendToUser(user.id, {
            title: "Notificações Ativadas! 🎉",
            body: "Você começará a receber suas designações e lembretes aqui.",
            type: NotificationType.REMINDER,
            data: {
                url: "/dashboard",
                isTest: true,
            },
        })

        return res.json({
            message: "Test notification sent",
            ...result,
        })
    }
}

export default new PushNotificationController()
