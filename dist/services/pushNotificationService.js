"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushNotificationService = void 0;
const web_push_1 = __importDefault(require("web-push"));
const config_1 = require("../config");
const Notification_1 = require("../entities/Notification");
const notificationRepository_1 = require("../repositories/notificationRepository");
const pushSubscriptionRepository_1 = require("../repositories/pushSubscriptionRepository");
const userRepository_1 = require("../repositories/userRepository");
class PushNotificationService {
    constructor() {
        this.isConfigured = false;
        this.init();
    }
    init() {
        if (config_1.config.vapid_public_key && config_1.config.vapid_private_key) {
            web_push_1.default.setVapidDetails(config_1.config.vapid_subject || "mailto:contato@informationboard.com", config_1.config.vapid_public_key, config_1.config.vapid_private_key);
            this.isConfigured = true;
        }
        else {
            console.warn("⚠️ VAPID keys are not configured. Web Push notifications will be disabled.");
        }
    }
    getPublicKey() {
        return config_1.config.vapid_public_key;
    }
    isPushAvailable() {
        return this.isConfigured;
    }
    /**
     * Envia notificação push para um usuário e salva no histórico do banco de dados
     */
    async sendToUser(userId, payload) {
        var _a;
        // 1. Salva notificação no banco
        const notification = notificationRepository_1.notificationRepository.create({
            user_id: userId,
            title: payload.title,
            body: payload.body,
            type: payload.type || Notification_1.NotificationType.REMINDER,
            data: payload.data || null,
            scheduled_at: payload.scheduled_at || null,
            sent_at: new Date(),
        });
        const savedNotification = await notificationRepository_1.notificationRepository.save(notification);
        let sentCount = 0;
        let failedCount = 0;
        if (!this.isConfigured) {
            return { notification: savedNotification, sentCount, failedCount };
        }
        // 2. Busca todas as inscrições ativas do usuário
        const subscriptions = await pushSubscriptionRepository_1.pushSubscriptionRepository.find({
            where: { user_id: userId },
        });
        if (!subscriptions || subscriptions.length === 0) {
            return { notification: savedNotification, sentCount, failedCount };
        }
        const pushData = JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: "/icons/pwa-192.png",
            badge: "/icons/pwa-192.png",
            data: {
                ...payload.data,
                id: savedNotification.id,
                type: payload.type,
                url: ((_a = payload.data) === null || _a === void 0 ? void 0 : _a.url) || "/dashboard",
            },
        });
        // 3. Dispara para cada dispositivo do usuário
        for (const sub of subscriptions) {
            try {
                await web_push_1.default.sendNotification({
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                    },
                }, pushData);
                sentCount++;
            }
            catch (err) {
                failedCount++;
                console.error(`Erro ao enviar push para subscription ${sub.id}:`, (err === null || err === void 0 ? void 0 : err.message) || err);
                // Se a inscrição expirou ou não existe mais no browser (404 / 410), removemos do banco
                if ((err === null || err === void 0 ? void 0 : err.statusCode) === 404 || (err === null || err === void 0 ? void 0 : err.statusCode) === 410) {
                    console.log(`Removendo subscription expirada: ${sub.id}`);
                    await pushSubscriptionRepository_1.pushSubscriptionRepository.delete({ id: sub.id });
                }
            }
        }
        return { notification: savedNotification, sentCount, failedCount };
    }
    /**
     * Envia notificação push para o usuário vinculado a um publicador
     */
    async sendToPublisher(publisherId, payload) {
        const user = await userRepository_1.userRepository.findOne({
            where: { publisher: { id: publisherId } },
        });
        if (!user) {
            return null;
        }
        return this.sendToUser(user.id, payload);
    }
    /**
     * Envia notificação para uma lista de publicadores
     */
    async sendToPublishers(publisherIds, payload) {
        const uniqueIds = Array.from(new Set(publisherIds.filter(Boolean)));
        for (const publisherId of uniqueIds) {
            try {
                await this.sendToPublisher(publisherId, payload);
            }
            catch (error) {
                console.error(`Erro ao enviar push para publicador ${publisherId}:`, error);
            }
        }
    }
}
exports.pushNotificationService = new PushNotificationService();
