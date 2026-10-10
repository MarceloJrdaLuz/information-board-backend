"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const permissions_1 = require("../../middlewares/permissions");
const pushSubscriptionRepository_1 = require("../../repositories/pushSubscriptionRepository");
const pushNotificationService_1 = require("../../services/pushNotificationService");
const Notification_1 = require("../../entities/Notification");
class PushNotificationController {
    /**
     * Retorna a chave pública VAPID para registro no navegador
     */
    async getPublicKey(req, res) {
        const publicKey = pushNotificationService_1.pushNotificationService.getPublicKey();
        return res.json({ publicKey });
    }
    /**
     * Salva ou atualiza a inscrição push do usuário logado
     */
    async subscribe(req, res) {
        const user = await (0, permissions_1.decoder)(req);
        const { endpoint, keys, userAgent } = req.body;
        if (!endpoint) {
            throw new api_errors_1.BadRequestError("Endpoint is required");
        }
        if (!keys || !keys.p256dh || !keys.auth) {
            throw new api_errors_1.BadRequestError("Keys (p256dh, auth) are required");
        }
        // Verifica se já existe a inscrição por endpoint
        let subscription = await pushSubscriptionRepository_1.pushSubscriptionRepository.findOne({
            where: { endpoint },
        });
        if (subscription) {
            subscription.user_id = user.id;
            subscription.p256dh = keys.p256dh;
            subscription.auth = keys.auth;
            subscription.user_agent = userAgent || req.headers["user-agent"] || null;
        }
        else {
            subscription = pushSubscriptionRepository_1.pushSubscriptionRepository.create({
                user_id: user.id,
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
                user_agent: userAgent || req.headers["user-agent"] || null,
            });
        }
        const saved = await pushSubscriptionRepository_1.pushSubscriptionRepository.save(subscription);
        return res.status(201).json({
            message: "Push subscription registered successfully",
            subscription: saved,
        });
    }
    /**
     * Remove a inscrição push informada para o usuário logado
     */
    async unsubscribe(req, res) {
        const user = await (0, permissions_1.decoder)(req);
        const { endpoint } = req.body;
        if (!endpoint) {
            throw new api_errors_1.BadRequestError("Endpoint is required");
        }
        await pushSubscriptionRepository_1.pushSubscriptionRepository.delete({
            endpoint,
            user_id: user.id,
        });
        return res.json({ message: "Push subscription removed successfully" });
    }
    /**
     * Retorna se o usuário possui inscrições ativas
     */
    async getStatus(req, res) {
        const user = await (0, permissions_1.decoder)(req);
        const count = await pushSubscriptionRepository_1.pushSubscriptionRepository.count({
            where: { user_id: user.id },
        });
        return res.json({
            isSubscribed: count > 0,
            subscriptionCount: count,
        });
    }
    /**
     * Envia uma notificação push de teste para o usuário logado
     */
    async testNotification(req, res) {
        const user = await (0, permissions_1.decoder)(req);
        const result = await pushNotificationService_1.pushNotificationService.sendToUser(user.id, {
            title: "Notificações Ativadas! 🎉",
            body: "Você começará a receber suas designações e lembretes aqui.",
            type: Notification_1.NotificationType.REMINDER,
            data: {
                url: "/dashboard",
                isTest: true,
            },
        });
        return res.json({
            message: "Test notification sent",
            ...result,
        });
    }
}
exports.default = new PushNotificationController();
