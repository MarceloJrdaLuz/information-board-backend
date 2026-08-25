import { Request, Response } from "express"
import { IsNull } from "typeorm"
import { NotFoundError } from "../../helpers/api-errors"
import { decoder } from "../../middlewares/permissions"
import { notificationRepository } from "../../repositories/notificationRepository"

class NotificationController {
    /**
     * Lista as notificações do usuário logado
     */
    async list(req: Request, res: Response) {
        const user = await decoder(req)
        const limit = Number(req.query.limit) || 20
        const page = Number(req.query.page) || 1
        const skip = (page - 1) * limit

        const [notifications, total] = await notificationRepository.findAndCount({
            where: { user_id: user.id },
            order: { created_at: "DESC" },
            take: limit,
            skip,
        })

        const unreadCount = await notificationRepository.count({
            where: {
                user_id: user.id,
                read_at: IsNull(),
            },
        })

        return res.json({
            notifications,
            total,
            unreadCount,
            page,
            limit,
        })
    }

    /**
     * Retorna a quantidade de notificações não lidas
     */
    async getUnreadCount(req: Request, res: Response) {
        const user = await decoder(req)

        const unreadCount = await notificationRepository.count({
            where: {
                user_id: user.id,
                read_at: IsNull(),
            },
        })

        return res.json({ unreadCount })
    }

    /**
     * Marca uma notificação como lida
     */
    async markAsRead(req: Request, res: Response) {
        const user = await decoder(req)
        const { notification_id } = req.params

        const notification = await notificationRepository.findOne({
            where: {
                id: notification_id,
                user_id: user.id,
            },
        })

        if (!notification) {
            throw new NotFoundError("Notification not found")
        }

        notification.read_at = new Date()
        await notificationRepository.save(notification)

        return res.json({
            message: "Notification marked as read",
            notification,
        })
    }

    /**
     * Marca todas as notificações do usuário como lidas
     */
    async markAllAsRead(req: Request, res: Response) {
        const user = await decoder(req)

        await notificationRepository.update(
            {
                user_id: user.id,
                read_at: IsNull(),
            },
            {
                read_at: new Date(),
            }
        )

        return res.json({
            message: "All notifications marked as read",
        })
    }
}

export default new NotificationController()
