"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const api_errors_1 = require("../../helpers/api-errors");
const permissions_1 = require("../../middlewares/permissions");
const pushSubscriptionRepository_1 = require("../../repositories/pushSubscriptionRepository");
const pushNotificationService_1 = require("../../services/pushNotificationService");
const userRepository_1 = require("../../repositories/userRepository");
const reportRepository_1 = require("../../repositories/reportRepository");
const Notification_1 = require("../../entities/Notification");
const enumWeekDays_1 = require("../../types/enumWeekDays");
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
    /**
     * Envia notificação push de teste simulando lembrete de relatório para o usuário logado
     */
    async testReportNotification(req, res) {
        var _a;
        const user = await (0, permissions_1.decoder)(req);
        const isDayOne = req.query.dayOne === "true";
        const force = req.query.force === "true";
        const today = (0, dayjs_1.default)((0, moment_timezone_1.default)().tz("America/Sao_Paulo").format("YYYY-MM-DD")).startOf("day");
        const targetPeriodDate = today.subtract(1, "month");
        const targetMonthIndex = targetPeriodDate.month();
        const targetYear = targetPeriodDate.format("YYYY");
        const MONTHS_BY_INDEX = [
            enumWeekDays_1.Months.JANEIRO,
            enumWeekDays_1.Months.FEVEREIRO,
            enumWeekDays_1.Months.MARCO,
            enumWeekDays_1.Months.ABRIL,
            enumWeekDays_1.Months.MAIO,
            enumWeekDays_1.Months.JUNHO,
            enumWeekDays_1.Months.JULHO,
            enumWeekDays_1.Months.AGOSTO,
            enumWeekDays_1.Months.SETEMBRO,
            enumWeekDays_1.Months.OUTUBRO,
            enumWeekDays_1.Months.NOVEMBRO,
            enumWeekDays_1.Months.DEZEMBRO,
        ];
        const targetMonthName = MONTHS_BY_INDEX[targetMonthIndex];
        const userWithRelations = await userRepository_1.userRepository.findOne({
            where: { id: user.id },
            relations: ["publisher", "publisher.congregation", "congregation"],
        });
        if (!(userWithRelations === null || userWithRelations === void 0 ? void 0 : userWithRelations.publisher)) {
            return res.status(400).json({
                message: "Usuário não está vinculado a nenhum publicador.",
            });
        }
        const publisherId = userWithRelations.publisher.id;
        // Verifica se já enviou o relatório para o mês de referência (case-insensitive)
        const pubReports = await reportRepository_1.reportRepository.find({
            where: {
                publisher: { id: publisherId },
                year: targetYear,
            },
        });
        const existingReport = pubReports.find(r => r.month && r.month.toString().trim().toLowerCase() === targetMonthName.toLowerCase());
        if (existingReport && !force) {
            return res.json({
                message: `Você já enviou o relatório de ${targetMonthName}/${targetYear}! Por isso, a notificação não foi disparada.`,
                alreadySubmitted: true,
                report: existingReport,
            });
        }
        const cong = ((_a = userWithRelations === null || userWithRelations === void 0 ? void 0 : userWithRelations.publisher) === null || _a === void 0 ? void 0 : _a.congregation) || (userWithRelations === null || userWithRelations === void 0 ? void 0 : userWithRelations.congregation);
        const congNumber = cong === null || cong === void 0 ? void 0 : cong.number;
        const reportUrl = congNumber ? `/${congNumber}/relatorio` : "/dashboard";
        const title = isDayOne
            ? `Relatório de Serviço de Campo`
            : `Lembrete: Relatório de ${targetMonthName}`;
        const body = isDayOne
            ? `O mês de ${targetMonthName} encerrou! Não se esqueça de enviar seu relatório de atividade.`
            : `Você ainda não enviou seu relatório de ${targetMonthName}. Toque aqui para enviar.`;
        const result = await pushNotificationService_1.pushNotificationService.sendToUser(user.id, {
            title,
            body,
            type: Notification_1.NotificationType.REPORT,
            data: {
                url: reportUrl,
                type: Notification_1.NotificationType.REPORT,
                month: targetMonthName,
                year: targetYear,
                isTest: true,
            },
        });
        return res.json({
            message: "Test report notification sent",
            reportUrl,
            ...result,
        });
    }
}
exports.default = new PushNotificationController();
