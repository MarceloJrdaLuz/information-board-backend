"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleReminderService = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const typeorm_1 = require("typeorm");
const Notification_1 = require("../entities/Notification");
const Publisher_1 = require("../entities/Publisher");
const cleaningGroupRepository_1 = require("../repositories/cleaningGroupRepository");
const cleaningScheduleRepository_1 = require("../repositories/cleaningScheduleRepository");
const congregationRepository_1 = require("../repositories/congregationRepository");
const fieldServiceScheduleRepository_1 = require("../repositories/fieldServiceScheduleRepository");
const fieldServiceTemplateRepository_1 = require("../repositories/fieldServiceTemplateRepository");
const midweekScheduleRepository_1 = require("../repositories/midweekScheduleRepository");
const notificationRepository_1 = require("../repositories/notificationRepository");
const publicWitnessAssignmentRepository_1 = require("../repositories/publicWitnessAssignmentRepository");
const publicWitnessTimeSlotRepository_1 = require("../repositories/publicWitnessTimeSlotRepository");
const scheduleReminderConfigRepository_1 = require("../repositories/scheduleReminderConfigRepository");
const specialEventRepository_1 = require("../repositories/specialEventRepository");
const userRepository_1 = require("../repositories/userRepository");
const weekendScheduleRepository_1 = require("../repositories/weekendScheduleRepository");
const pushNotificationService_1 = require("./pushNotificationService");
class ScheduleReminderService {
    /**
     * Retorna a lista de pendências/alertas de programações do próximo mês para uma congregação.
     */
    async getPendingAlertsForCongregation(congregation_id) {
        let config = await scheduleReminderConfigRepository_1.scheduleReminderConfigRepository.findOne({
            where: { congregation_id }
        });
        if (!config) {
            config = scheduleReminderConfigRepository_1.scheduleReminderConfigRepository.create({
                congregation_id,
                cleaning_enabled: true,
                cleaning_days_before: 15,
                field_service_enabled: true,
                field_service_days_before: 15,
                public_witnessing_enabled: true,
                public_witnessing_days_before: 15,
                midweek_meeting_enabled: true,
                midweek_meeting_days_before: 30,
                weekend_meeting_enabled: true,
                weekend_meeting_days_before: 20
            });
        }
        const today = (0, dayjs_1.default)();
        const nextMonth = today.add(1, "month");
        const nextMonthStart = nextMonth.startOf("month").format("YYYY-MM-DD");
        const nextMonthEnd = nextMonth.endOf("month").format("YYYY-MM-DD");
        const nextMonthLabel = nextMonth.locale("pt-br").format("MMMM [de] YYYY");
        const capitalizedNextMonth = nextMonthLabel.charAt(0).toUpperCase() + nextMonthLabel.slice(1);
        const daysUntilNextMonth = (0, dayjs_1.default)(nextMonthStart).diff(today.startOf("day"), "day");
        const alerts = [];
        // 1. Limpeza
        if (config.cleaning_enabled && daysUntilNextMonth <= config.cleaning_days_before) {
            const totalCleaningGroups = await cleaningGroupRepository_1.cleaningGroupRepository.count({
                where: { congregation: { id: congregation_id } }
            });
            const totalCleaningSchedules = await cleaningScheduleRepository_1.cleaningScheduleRepository.count({
                where: { congregation_id }
            });
            if (totalCleaningGroups > 0 || totalCleaningSchedules > 0) {
                const cleaningCount = await cleaningScheduleRepository_1.cleaningScheduleRepository
                    .createQueryBuilder("cs")
                    .where("cs.congregation_id = :congregation_id", { congregation_id })
                    .andWhere("cs.date >= :start AND cs.date <= :end", { start: nextMonthStart, end: nextMonthEnd })
                    .getCount();
                if (cleaningCount === 0) {
                    alerts.push({
                        id: "cleaning",
                        module: "CLEANING",
                        roleRequired: "CLEANING_MANAGER",
                        title: "Programação de Limpeza",
                        message: `A programação de limpeza de ${capitalizedNextMonth} ainda não foi gerada.`,
                        link: "/congregacao/programacao-limpeza",
                        actionLabel: "Gerar Programação",
                        daysRemaining: daysUntilNextMonth,
                        severity: daysUntilNextMonth <= 7 ? "HIGH" : "MEDIUM"
                    });
                }
            }
        }
        // 2. Serviço de Campo
        if (config.field_service_enabled && daysUntilNextMonth <= config.field_service_days_before) {
            const templatesCount = await fieldServiceTemplateRepository_1.fieldServiceTemplateRepository.count({
                where: { congregation_id }
            });
            const totalFieldSchedules = await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository
                .createQueryBuilder("fss")
                .innerJoin("fss.template", "fst")
                .where("fst.congregation_id = :congregation_id", { congregation_id })
                .getCount();
            if (templatesCount > 0 || totalFieldSchedules > 0) {
                const scheduleCount = await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository
                    .createQueryBuilder("fss")
                    .innerJoin("fss.template", "fst")
                    .where("fst.congregation_id = :congregation_id", { congregation_id })
                    .andWhere("fss.date >= :start AND fss.date <= :end", { start: nextMonthStart, end: nextMonthEnd })
                    .getCount();
                if (scheduleCount === 0) {
                    alerts.push({
                        id: "field_service",
                        module: "FIELD_SERVICE",
                        roleRequired: "FIELD_SERVICE_MANAGER",
                        title: "Programação de Campo",
                        message: `A programação de saídas de campo de ${capitalizedNextMonth} ainda não foi gerada.`,
                        link: "/congregacao/programacao-campo",
                        actionLabel: "Gerar Programação",
                        daysRemaining: daysUntilNextMonth,
                        severity: daysUntilNextMonth <= 7 ? "HIGH" : "MEDIUM"
                    });
                }
            }
        }
        // 3. Testemunho Público (somente se houver horários rotativos)
        if (config.public_witnessing_enabled && daysUntilNextMonth <= config.public_witnessing_days_before) {
            const rotativeSlotsCount = await publicWitnessTimeSlotRepository_1.publicWitnessTimeSlotRepository
                .createQueryBuilder("ts")
                .innerJoin("ts.arrangement", "arr")
                .where("arr.congregation_id = :congregation_id", { congregation_id })
                .andWhere("ts.is_rotative = true")
                .getCount();
            if (rotativeSlotsCount > 0) {
                const assignmentsCount = await publicWitnessAssignmentRepository_1.publicWitnessAssignmentRepository
                    .createQueryBuilder("pwa")
                    .innerJoin("pwa.timeSlot", "ts")
                    .innerJoin("ts.arrangement", "arr")
                    .where("arr.congregation_id = :congregation_id", { congregation_id })
                    .andWhere("pwa.date >= :start AND pwa.date <= :end", { start: nextMonthStart, end: nextMonthEnd })
                    .getCount();
                if (assignmentsCount === 0) {
                    alerts.push({
                        id: "public_witness",
                        module: "PUBLIC_WITNESS",
                        roleRequired: "PUBLIC_WITNESS_MANAGER",
                        title: "Testemunho Público",
                        message: `A escala de testemunho público de ${capitalizedNextMonth} ainda não foi gerada.`,
                        link: "/congregacao/testemunho-publico",
                        actionLabel: "Gerar Escala",
                        daysRemaining: daysUntilNextMonth,
                        severity: daysUntilNextMonth <= 7 ? "HIGH" : "MEDIUM"
                    });
                }
            }
        }
        // 4. Reunião de Meio de Semana
        if (config.midweek_meeting_enabled && daysUntilNextMonth <= config.midweek_meeting_days_before) {
            const totalMidweekSchedules = await midweekScheduleRepository_1.midweekScheduleRepository.count({
                where: { congregation_id }
            });
            if (totalMidweekSchedules > 0) {
                const midweekCount = await midweekScheduleRepository_1.midweekScheduleRepository
                    .createQueryBuilder("ms")
                    .where("ms.congregation_id = :congregation_id", { congregation_id })
                    .andWhere("ms.meetingDate >= :start AND ms.meetingDate <= :end", { start: nextMonthStart, end: nextMonthEnd })
                    .getCount();
                if (midweekCount === 0) {
                    alerts.push({
                        id: "midweek_meeting",
                        module: "MIDWEEK_MEETING",
                        roleRequired: "MIDWEEK_MANAGER",
                        title: "Reunião de Meio de Semana (RVM)",
                        message: `A programação de Meio de Semana de ${capitalizedNextMonth} ainda não foi programada.`,
                        link: "/reunioes/meiodesemana",
                        actionLabel: "Programar Reunião",
                        daysRemaining: daysUntilNextMonth,
                        severity: daysUntilNextMonth <= 10 ? "HIGH" : "MEDIUM"
                    });
                }
            }
        }
        // 5. Reunião de Fim de Semana (Discursos / Oradores)
        if (config.weekend_meeting_enabled && daysUntilNextMonth <= config.weekend_meeting_days_before) {
            const totalWeekendSchedules = await weekendScheduleRepository_1.weekendScheduleRepository.count({
                where: { congregation: { id: congregation_id } }
            });
            if (totalWeekendSchedules > 0) {
                const weekendSchedules = await weekendScheduleRepository_1.weekendScheduleRepository
                    .createQueryBuilder("ws")
                    .where("ws.congregation_id = :congregation_id", { congregation_id })
                    .andWhere("ws.date >= :start AND ws.date <= :end", { start: nextMonthStart, end: nextMonthEnd })
                    .getMany();
                const specialEvents = await specialEventRepository_1.specialEventRepository
                    .createQueryBuilder("se")
                    .where("se.congregation_id = :congregation_id", { congregation_id })
                    .andWhere("se.startDate <= :end AND se.endDate >= :start", { start: nextMonthStart, end: nextMonthEnd })
                    .getMany();
                const specialEventDates = new Set();
                for (const se of specialEvents) {
                    let cur = (0, dayjs_1.default)(se.startDate);
                    const end = (0, dayjs_1.default)(se.endDate);
                    while (cur.isSameOrBefore(end)) {
                        specialEventDates.add(cur.format("YYYY-MM-DD"));
                        cur = cur.add(1, "day");
                    }
                }
                if (weekendSchedules.length === 0) {
                    alerts.push({
                        id: "weekend_meeting",
                        module: "WEEKEND_MEETING",
                        roleRequired: "TALK_MANAGER",
                        title: "Reunião de Fim de Semana (Oradores)",
                        message: `A escala de discursos públicos de ${capitalizedNextMonth} ainda não possui datas cadastradas.`,
                        link: `/reunioes/fimdesemana/programacao?date=${nextMonthStart}`,
                        actionLabel: "Ir para o mês",
                        daysRemaining: daysUntilNextMonth,
                        severity: daysUntilNextMonth <= 7 ? "HIGH" : "MEDIUM"
                    });
                }
                else {
                    const missingSpeakers = weekendSchedules.filter(s => !s.speaker_id && !specialEventDates.has(s.date));
                    if (missingSpeakers.length > 0) {
                        alerts.push({
                            id: "weekend_meeting_incomplete",
                            module: "WEEKEND_MEETING",
                            roleRequired: "TALK_MANAGER",
                            title: "Reunião de Fim de Semana (Oradores)",
                            message: `Há ${missingSpeakers.length} reunião(ões) em ${capitalizedNextMonth} sem orador definido.`,
                            link: `/reunioes/fimdesemana/programacao?date=${nextMonthStart}`,
                            actionLabel: "Ir para o mês",
                            daysRemaining: daysUntilNextMonth,
                            severity: "HIGH"
                        });
                    }
                }
            }
        }
        return alerts;
    }
    /**
     * Localiza os usuários responsáveis por um módulo na congregação.
     * Se houver usuários com a role correspondente (ex: CLEANING_MANAGER), retorna esses usuários.
     * Caso ninguém na congregação tenha essa role, retorna os ADMIN_CONGREGATION como fallback.
     */
    async getResponsiblesForModule(congregation_id, roleRequired) {
        const congregationUsers = await userRepository_1.userRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["roles", "publisher"]
        });
        // Apenas publicadores ativos (não removidos / desassociados)
        const validUsers = congregationUsers.filter(u => {
            if (!u.publisher)
                return true;
            return u.publisher.situation !== Publisher_1.Situation.Removido && u.publisher.situation !== Publisher_1.Situation.Desassociado;
        });
        const managers = validUsers.filter(u => u.roles.some(r => r.name === roleRequired));
        if (managers.length > 0) {
            return managers;
        }
        // Fallback: Administradores da congregação
        const admins = validUsers.filter(u => u.roles.some(r => r.name === "ADMIN_CONGREGATION"));
        return admins;
    }
    /**
     * Cron Job diário executado por volta do meio-dia para disparar notificações push
     * aos responsáveis sobre programações pendentes do próximo mês.
     */
    async dispatchDailyScheduleReminders() {
        const todayMoment = (0, moment_timezone_1.default)().tz("America/Sao_Paulo");
        const todayStart = todayMoment.clone().startOf("day").toDate();
        const todayEnd = todayMoment.clone().endOf("day").toDate();
        const targetMonthStr = (0, dayjs_1.default)().add(1, "month").format("YYYY-MM");
        const congregations = await congregationRepository_1.congregationRepository.find();
        let totalAlertsFound = 0;
        let totalNotificationsSent = 0;
        const errors = [];
        for (const cong of congregations) {
            try {
                const alerts = await this.getPendingAlertsForCongregation(cong.id);
                if (alerts.length === 0)
                    continue;
                totalAlertsFound += alerts.length;
                for (const alert of alerts) {
                    const targets = await this.getResponsiblesForModule(cong.id, alert.roleRequired);
                    for (const user of targets) {
                        try {
                            // Verifica se já enviamos notificação para este alerta específico e mês hoje
                            const existingToday = await notificationRepository_1.notificationRepository.find({
                                where: {
                                    user_id: user.id,
                                    type: Notification_1.NotificationType.REMINDER,
                                    sent_at: (0, typeorm_1.Between)(todayStart, todayEnd)
                                }
                            });
                            const alreadySent = existingToday.some(n => { var _a, _b; return ((_a = n.data) === null || _a === void 0 ? void 0 : _a.alertId) === alert.id && ((_b = n.data) === null || _b === void 0 ? void 0 : _b.targetMonth) === targetMonthStr; });
                            if (alreadySent) {
                                continue;
                            }
                            // Dispara push notification
                            const pushResult = await pushNotificationService_1.pushNotificationService.sendToUser(user.id, {
                                title: `Lembrete: ${alert.title}`,
                                body: alert.message,
                                type: Notification_1.NotificationType.REMINDER,
                                data: {
                                    url: alert.link,
                                    alertId: alert.id,
                                    module: alert.module,
                                    targetMonth: targetMonthStr
                                }
                            });
                            if (pushResult && pushResult.sentCount > 0) {
                                totalNotificationsSent++;
                            }
                        }
                        catch (userErr) {
                            errors.push({
                                congregationId: cong.id,
                                userId: user.id,
                                alertId: alert.id,
                                error: (userErr === null || userErr === void 0 ? void 0 : userErr.message) || String(userErr)
                            });
                        }
                    }
                }
            }
            catch (congErr) {
                errors.push({
                    congregationId: cong.id,
                    error: (congErr === null || congErr === void 0 ? void 0 : congErr.message) || String(congErr)
                });
            }
        }
        return {
            processedCongregations: congregations.length,
            alertsFound: totalAlertsFound,
            notificationsSent: totalNotificationsSent,
            errors
        };
    }
}
exports.scheduleReminderService = new ScheduleReminderService();
