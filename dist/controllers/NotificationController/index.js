"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const api_errors_1 = require("../../helpers/api-errors");
const permissions_1 = require("../../middlewares/permissions");
const notificationRepository_1 = require("../../repositories/notificationRepository");
class NotificationController {
    /**
     * Lista as notificações do usuário logado
     */
    async list(req, res) {
        const user = await (0, permissions_1.decoder)(req);
        const limit = Number(req.query.limit) || 20;
        const page = Number(req.query.page) || 1;
        const skip = (page - 1) * limit;
        const [notifications, total] = await notificationRepository_1.notificationRepository.findAndCount({
            where: { user_id: user.id },
            order: { created_at: "DESC" },
            take: limit,
            skip,
        });
        const unreadCount = await notificationRepository_1.notificationRepository.count({
            where: {
                user_id: user.id,
                read_at: (0, typeorm_1.IsNull)(),
            },
        });
        return res.json({
            notifications,
            total,
            unreadCount,
            page,
            limit,
        });
    }
    /**
     * Retorna a quantidade de notificações não lidas
     */
    async getUnreadCount(req, res) {
        const user = await (0, permissions_1.decoder)(req);
        const unreadCount = await notificationRepository_1.notificationRepository.count({
            where: {
                user_id: user.id,
                read_at: (0, typeorm_1.IsNull)(),
            },
        });
        return res.json({ unreadCount });
    }
    /**
     * Marca uma notificação como lida
     */
    async markAsRead(req, res) {
        const user = await (0, permissions_1.decoder)(req);
        const { notification_id } = req.params;
        const notification = await notificationRepository_1.notificationRepository.findOne({
            where: {
                id: notification_id,
                user_id: user.id,
            },
        });
        if (!notification) {
            throw new api_errors_1.NotFoundError("Notification not found");
        }
        notification.read_at = new Date();
        await notificationRepository_1.notificationRepository.save(notification);
        return res.json({
            message: "Notification marked as read",
            notification,
        });
    }
    /**
     * Marca todas as notificações do usuário como lidas
     */
    async markAllAsRead(req, res) {
        const user = await (0, permissions_1.decoder)(req);
        await notificationRepository_1.notificationRepository.update({
            user_id: user.id,
            read_at: (0, typeorm_1.IsNull)(),
        }, {
            read_at: new Date(),
        });
        return res.json({
            message: "All notifications marked as read",
        });
    }
}
exports.default = new NotificationController();
