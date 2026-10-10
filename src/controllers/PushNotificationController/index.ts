import { Request, Response } from "express"
import dayjs from "dayjs"
import moment from "moment-timezone"
import { BadRequestError } from "../../helpers/api-errors"
import { decoder } from "../../middlewares/permissions"
import { pushSubscriptionRepository } from "../../repositories/pushSubscriptionRepository"
import { pushNotificationService } from "../../services/pushNotificationService"
import { userRepository } from "../../repositories/userRepository"
import { reportRepository } from "../../repositories/reportRepository"
import { NotificationType } from "../../entities/Notification"
import { Months } from "../../types/enumWeekDays"

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

    /**
     * Envia notificação push de teste simulando lembrete de relatório para o usuário logado
     */
    async testReportNotification(req: Request, res: Response) {
        const user = await decoder(req)
        const isDayOne = req.query.dayOne === "true"
        const force = req.query.force === "true"

        const today = dayjs(moment().tz("America/Sao_Paulo").format("YYYY-MM-DD")).startOf("day")
        const targetPeriodDate = today.subtract(1, "month")
        const targetMonthIndex = targetPeriodDate.month()
        const targetYear = targetPeriodDate.format("YYYY")

        const MONTHS_BY_INDEX: Months[] = [
            Months.JANEIRO,
            Months.FEVEREIRO,
            Months.MARCO,
            Months.ABRIL,
            Months.MAIO,
            Months.JUNHO,
            Months.JULHO,
            Months.AGOSTO,
            Months.SETEMBRO,
            Months.OUTUBRO,
            Months.NOVEMBRO,
            Months.DEZEMBRO,
        ]
        const targetMonthName = MONTHS_BY_INDEX[targetMonthIndex]

        const userWithRelations = await userRepository.findOne({
            where: { id: user.id },
            relations: ["publisher", "publisher.congregation", "congregation"],
        })

        if (!userWithRelations?.publisher) {
            return res.status(400).json({
                message: "Usuário não está vinculado a nenhum publicador.",
            })
        }

        const publisherId = userWithRelations.publisher.id

        // Verifica se já enviou o relatório para o mês de referência (case-insensitive)
        const pubReports = await reportRepository.find({
            where: {
                publisher: { id: publisherId },
                year: targetYear,
            },
        })

        const existingReport = pubReports.find(
            r => r.month && r.month.toString().trim().toLowerCase() === targetMonthName.toLowerCase()
        )

        if (existingReport && !force) {
            return res.json({
                message: `Você já enviou o relatório de ${targetMonthName}/${targetYear}! Por isso, a notificação não foi disparada.`,
                alreadySubmitted: true,
                report: existingReport,
            })
        }

        const cong = userWithRelations?.publisher?.congregation || userWithRelations?.congregation
        const congNumber = cong?.number
        const reportUrl = congNumber ? `/${congNumber}/relatorio` : "/dashboard"

        const title = isDayOne
            ? `Relatório de Serviço de Campo`
            : `Lembrete: Relatório de ${targetMonthName}`

        const body = isDayOne
            ? `O mês de ${targetMonthName} encerrou! Não se esqueça de enviar seu relatório de atividade.`
            : `Você ainda não enviou seu relatório de ${targetMonthName}. Toque aqui para enviar.`

        const result = await pushNotificationService.sendToUser(user.id, {
            title,
            body,
            type: NotificationType.REPORT,
            data: {
                url: reportUrl,
                type: NotificationType.REPORT,
                month: targetMonthName,
                year: targetYear,
                isTest: true,
            },
        })

        return res.json({
            message: "Test report notification sent",
            reportUrl,
            ...result,
        })
    }
}

export default new PushNotificationController()
