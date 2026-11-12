import dayjs from "dayjs";
import moment from "moment-timezone";
import { Between } from "typeorm";
import { NotificationType } from "../entities/Notification";
import { Situation } from "../entities/Publisher";
import { cleaningGroupRepository } from "../repositories/cleaningGroupRepository";
import { cleaningScheduleRepository } from "../repositories/cleaningScheduleRepository";
import { congregationRepository } from "../repositories/congregationRepository";
import { fieldServiceScheduleRepository } from "../repositories/fieldServiceScheduleRepository";
import { fieldServiceTemplateRepository } from "../repositories/fieldServiceTemplateRepository";
import { midweekScheduleRepository } from "../repositories/midweekScheduleRepository";
import { notificationRepository } from "../repositories/notificationRepository";
import { publicWitnessAssignmentRepository } from "../repositories/publicWitnessAssignmentRepository";
import { publicWitnessTimeSlotRepository } from "../repositories/publicWitnessTimeSlotRepository";
import { scheduleReminderConfigRepository } from "../repositories/scheduleReminderConfigRepository";
import { specialEventRepository } from "../repositories/specialEventRepository";
import { userRepository } from "../repositories/userRepository";
import { weekendScheduleRepository } from "../repositories/weekendScheduleRepository";
import { pushNotificationService } from "./pushNotificationService";

export interface IScheduleAlert {
    id: string;
    module: "CLEANING" | "FIELD_SERVICE" | "PUBLIC_WITNESS" | "MIDWEEK_MEETING" | "WEEKEND_MEETING";
    roleRequired: "CLEANING_MANAGER" | "FIELD_SERVICE_MANAGER" | "PUBLIC_WITNESS_MANAGER" | "MIDWEEK_MANAGER" | "TALK_MANAGER";
    title: string;
    message: string;
    link: string;
    actionLabel: string;
    daysRemaining: number;
    severity: "HIGH" | "MEDIUM" | "LOW";
}

class ScheduleReminderService {
    /**
     * Retorna a lista de pendências/alertas de programações do próximo mês para uma congregação.
     */
    public async getPendingAlertsForCongregation(congregation_id: string): Promise<IScheduleAlert[]> {
        let config = await scheduleReminderConfigRepository.findOne({
            where: { congregation_id }
        });

        if (!config) {
            config = scheduleReminderConfigRepository.create({
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

        const today = dayjs();
        const nextMonth = today.add(1, "month");
        const nextMonthStart = nextMonth.startOf("month").format("YYYY-MM-DD");
        const nextMonthEnd = nextMonth.endOf("month").format("YYYY-MM-DD");
        const nextMonthLabel = nextMonth.locale("pt-br").format("MMMM [de] YYYY");
        const capitalizedNextMonth = nextMonthLabel.charAt(0).toUpperCase() + nextMonthLabel.slice(1);

        const daysUntilNextMonth = dayjs(nextMonthStart).diff(today.startOf("day"), "day");
        const alerts: IScheduleAlert[] = [];

        // 1. Limpeza
        if (config.cleaning_enabled && daysUntilNextMonth <= config.cleaning_days_before) {
            const totalCleaningGroups = await cleaningGroupRepository.count({
                where: { congregation: { id: congregation_id } }
            });
            const totalCleaningSchedules = await cleaningScheduleRepository.count({
                where: { congregation_id }
            });

            if (totalCleaningGroups > 0 || totalCleaningSchedules > 0) {
                const cleaningCount = await cleaningScheduleRepository
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
            const templatesCount = await fieldServiceTemplateRepository.count({
                where: { congregation_id }
            });
            const totalFieldSchedules = await fieldServiceScheduleRepository
                .createQueryBuilder("fss")
                .innerJoin("fss.template", "fst")
                .where("fst.congregation_id = :congregation_id", { congregation_id })
                .getCount();

            if (templatesCount > 0 || totalFieldSchedules > 0) {
                const scheduleCount = await fieldServiceScheduleRepository
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
            const rotativeSlotsCount = await publicWitnessTimeSlotRepository
                .createQueryBuilder("ts")
                .innerJoin("ts.arrangement", "arr")
                .where("arr.congregation_id = :congregation_id", { congregation_id })
                .andWhere("ts.is_rotative = true")
                .getCount();

            if (rotativeSlotsCount > 0) {
                const assignmentsCount = await publicWitnessAssignmentRepository
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
            const totalMidweekSchedules = await midweekScheduleRepository.count({
                where: { congregation_id }
            });

            if (totalMidweekSchedules > 0) {
                const midweekCount = await midweekScheduleRepository
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
            const totalWeekendSchedules = await weekendScheduleRepository.count({
                where: { congregation: { id: congregation_id } }
            });

            if (totalWeekendSchedules > 0) {
                const weekendSchedules = await weekendScheduleRepository
                    .createQueryBuilder("ws")
                    .where("ws.congregation_id = :congregation_id", { congregation_id })
                    .andWhere("ws.date >= :start AND ws.date <= :end", { start: nextMonthStart, end: nextMonthEnd })
                    .getMany();

                const specialEvents = await specialEventRepository
                    .createQueryBuilder("se")
                    .where("se.congregation_id = :congregation_id", { congregation_id })
                    .andWhere("se.startDate <= :end AND se.endDate >= :start", { start: nextMonthStart, end: nextMonthEnd })
                    .getMany();

                const specialEventDates = new Set<string>();
                for (const se of specialEvents) {
                    let cur = dayjs(se.startDate);
                    const end = dayjs(se.endDate);
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
                } else {
                    const missingSpeakers = weekendSchedules.filter(
                        s => !s.speaker_id && !specialEventDates.has(s.date)
                    );

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
    public async getResponsiblesForModule(congregation_id: string, roleRequired: string) {
        const congregationUsers = await userRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["roles", "publisher"]
        });

        // Apenas publicadores ativos (não removidos / desassociados)
        const validUsers = congregationUsers.filter(u => {
            if (!u.publisher) return true;
            return u.publisher.situation !== Situation.Removido && u.publisher.situation !== Situation.Desassociado;
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
    public async dispatchDailyScheduleReminders(): Promise<{
        processedCongregations: number;
        alertsFound: number;
        notificationsSent: number;
        errors: any[];
    }> {
        const todayMoment = moment().tz("America/Sao_Paulo");
        const todayStart = todayMoment.clone().startOf("day").toDate();
        const todayEnd = todayMoment.clone().endOf("day").toDate();

        const targetMonthStr = dayjs().add(1, "month").format("YYYY-MM");

        const congregations = await congregationRepository.find();
        let totalAlertsFound = 0;
        let totalNotificationsSent = 0;
        const errors: any[] = [];

        for (const cong of congregations) {
            try {
                const alerts = await this.getPendingAlertsForCongregation(cong.id);
                if (alerts.length === 0) continue;

                totalAlertsFound += alerts.length;

                for (const alert of alerts) {
                    const targets = await this.getResponsiblesForModule(cong.id, alert.roleRequired);

                    for (const user of targets) {
                        try {
                            // Verifica se já enviamos notificação para este alerta específico e mês hoje
                            const existingToday = await notificationRepository.find({
                                where: {
                                    user_id: user.id,
                                    type: NotificationType.REMINDER,
                                    sent_at: Between(todayStart, todayEnd)
                                }
                            });

                            const alreadySent = existingToday.some(
                                n => n.data?.alertId === alert.id && n.data?.targetMonth === targetMonthStr
                            );

                            if (alreadySent) {
                                continue;
                            }

                            // Dispara push notification
                            const pushResult = await pushNotificationService.sendToUser(user.id, {
                                title: `Lembrete: ${alert.title}`,
                                body: alert.message,
                                type: NotificationType.REMINDER,
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
                        } catch (userErr: any) {
                            errors.push({
                                congregationId: cong.id,
                                userId: user.id,
                                alertId: alert.id,
                                error: userErr?.message || String(userErr)
                            });
                        }
                    }
                }
            } catch (congErr: any) {
                errors.push({
                    congregationId: cong.id,
                    error: congErr?.message || String(congErr)
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

export const scheduleReminderService = new ScheduleReminderService();
