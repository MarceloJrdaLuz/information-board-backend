import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { Request, Response } from "express";
import { ScheduleReminderConfig } from "../../entities/ScheduleReminderConfig";
import { Situation } from "../../entities/Publisher";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { decoder } from "../../middlewares/permissions";
import { cleaningScheduleRepository } from "../../repositories/cleaningScheduleRepository";
import { fieldServiceScheduleRepository } from "../../repositories/fieldServiceScheduleRepository";
import { fieldServiceTemplateRepository } from "../../repositories/fieldServiceTemplateRepository";
import { midweekScheduleRepository } from "../../repositories/midweekScheduleRepository";
import { publicWitnessArrangementRepository } from "../../repositories/publicWitnessArrangementRepository";
import { publicWitnessAssignmentRepository } from "../../repositories/publicWitnessAssignmentRepository";
import { roleRepository } from "../../repositories/roleRepository";
import { scheduleReminderConfigRepository } from "../../repositories/scheduleReminderConfigRepository";
import { userRepository } from "../../repositories/userRepository";
import { weekendScheduleRepository } from "../../repositories/weekendScheduleRepository";
import { specialEventRepository } from "../../repositories/specialEventRepository";

dayjs.locale("pt-br");

function getDefaultConfig(congregation_id: string): ScheduleReminderConfig {
    const config = new ScheduleReminderConfig();
    config.congregation_id = congregation_id;
    config.cleaning_days_before = 15;
    config.cleaning_enabled = true;
    config.field_service_days_before = 15;
    config.field_service_enabled = true;
    config.public_witnessing_days_before = 15;
    config.public_witnessing_enabled = true;
    config.midweek_meeting_days_before = 30;
    config.midweek_meeting_enabled = true;
    config.weekend_meeting_days_before = 20;
    config.weekend_meeting_enabled = true;
    return config;
}

export interface IScheduleAlert {
    id: string;
    module: "CLEANING" | "FIELD_SERVICE" | "PUBLIC_WITNESS" | "MIDWEEK_MEETING" | "WEEKEND_MEETING";
    roleRequired: string;
    title: string;
    message: string;
    link: string;
    actionLabel: string;
    daysRemaining: number;
    severity: "HIGH" | "MEDIUM" | "LOW";
    isCurrentMonthUrgent?: boolean;
}

export class ScheduleReminderController {
    async getConfig(req: Request, res: Response) {
        const { congregation_id } = req.params;

        if (!congregation_id) {
            throw new BadRequestError("congregation_id is required");
        }

        let config = await scheduleReminderConfigRepository.findOne({
            where: { congregation_id }
        });

        if (!config) {
            config = getDefaultConfig(congregation_id);
        }

        return res.status(200).json(config);
    }

    async updateConfig(req: Request, res: Response) {
        const { congregation_id } = req.params;

        if (!congregation_id) {
            throw new BadRequestError("congregation_id is required");
        }

        let config = await scheduleReminderConfigRepository.findOne({
            where: { congregation_id }
        });

        if (!config) {
            config = getDefaultConfig(congregation_id);
        }

        scheduleReminderConfigRepository.merge(config, req.body);
        const saved = await scheduleReminderConfigRepository.save(config);
        return res.status(200).json(saved);
    }

    async getResponsibles(req: Request, res: Response) {
        const { congregation_id } = req.params;

        if (!congregation_id) {
            throw new BadRequestError("congregation_id is required");
        }

        // Busca todos os usuários da congregação com suas roles e publisher
        const users = await userRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["roles", "publisher", "publisher.congregation"]
        });

        // Filtra para exibir APENAS publicadores que ainda pertencem à congregação e estão ativos
        const activeCongregationUsers = users.filter(u => {
            if (!u.publisher) return false;

            const pubCongId = u.publisher.congregation?.id || (u.publisher as any).congregation_id;
            if (pubCongId && pubCongId !== congregation_id) {
                return false;
            }

            if (u.publisher.situation === Situation.Removido || u.publisher.situation === Situation.Desassociado) {
                return false;
            }

            return true;
        });

        const targetRoles = [
            "CLEANING_MANAGER",
            "FIELD_SERVICE_MANAGER",
            "PUBLIC_WITNESS_MANAGER",
            "MIDWEEK_MANAGER",
            "TALK_MANAGER"
        ];

        const responsiblesByRole: Record<string, { id: string; name: string; email: string }[]> = {
            CLEANING_MANAGER: [],
            FIELD_SERVICE_MANAGER: [],
            PUBLIC_WITNESS_MANAGER: [],
            MIDWEEK_MANAGER: [],
            TALK_MANAGER: []
        };

        activeCongregationUsers.forEach(u => {
            const displayName = u.publisher?.fullName || u.fullName || u.email;
            const roleNames = u.roles?.map(r => r.name) || [];

            targetRoles.forEach(r => {
                if (roleNames.includes(r)) {
                    responsiblesByRole[r].push({
                        id: u.id,
                        name: displayName,
                        email: u.email
                    });
                }
            });
        });

        // Lista simplificada de todos os publicadores válidos disponíveis, ordenada alfabeticamente
        const allAvailableUsers = activeCongregationUsers
            .map(u => ({
                id: u.id,
                name: u.publisher?.fullName || u.fullName || u.email,
                email: u.email
            }))
            .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));

        return res.status(200).json({
            responsiblesByRole,
            availableUsers: allAvailableUsers
        });
    }

    async updateResponsibles(req: Request, res: Response) {
        const { congregation_id } = req.params;
        const { roleName, userIds } = req.body as { roleName: string; userIds: string[] };

        if (!congregation_id || !roleName || !Array.isArray(userIds)) {
            throw new BadRequestError("congregation_id, roleName and userIds are required");
        }

        const allowedRoles = [
            "CLEANING_MANAGER",
            "FIELD_SERVICE_MANAGER",
            "PUBLIC_WITNESS_MANAGER",
            "MIDWEEK_MANAGER",
            "TALK_MANAGER"
        ];

        if (!allowedRoles.includes(roleName)) {
            throw new BadRequestError(`Invalid roleName. Allowed: ${allowedRoles.join(", ")}`);
        }

        let targetRole = await roleRepository.findOne({ where: { name: roleName } });
        if (!targetRole) {
            const descriptions: Record<string, string> = {
                CLEANING_MANAGER: "Gerenciador de Limpeza",
                FIELD_SERVICE_MANAGER: "Gerenciador de Campo",
                PUBLIC_WITNESS_MANAGER: "Gerenciador de Testemunho Público",
                MIDWEEK_MANAGER: "Gerenciador de Reunião Meio de Semana",
                TALK_MANAGER: "Gerenciador de Discursos"
            };

            targetRole = roleRepository.create({
                name: roleName,
                description: descriptions[roleName] || `Gerenciador de ${roleName}`,
                permissions: []
            });
            await roleRepository.save(targetRole);
        }

        const congregationUsers = await userRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["roles"]
        });

        for (const user of congregationUsers) {
            const shouldHave = userIds.includes(user.id);
            const currentlyHas = user.roles.some(r => r.name === roleName);

            if (shouldHave && !currentlyHas) {
                user.roles.push(targetRole);
                await userRepository.save(user);
            } else if (!shouldHave && currentlyHas) {
                user.roles = user.roles.filter(r => r.name !== roleName);
                await userRepository.save(user);
            }
        }

        return res.status(200).json({ message: "Responsáveis atualizados com sucesso!" });
    }

    async getAlerts(req: Request, res: Response) {
        const { congregation_id } = req.params;

        if (!congregation_id) {
            throw new BadRequestError("congregation_id is required");
        }

        // Obtém o usuário que fez a requisição
        const currentUser = await decoder(req);
        const userRoles = currentUser.roles?.map(r => r.name) || [];
        const isAdminCongregation = userRoles.includes("ADMIN_CONGREGATION") || userRoles.includes("ADMIN");

        // Carrega configurações de lembrete
        let config = await scheduleReminderConfigRepository.findOne({
            where: { congregation_id }
        });

        if (!config) {
            config = getDefaultConfig(congregation_id);
        }

        const today = dayjs();
        const nextMonth = today.add(1, "month");
        const nextMonthStart = nextMonth.startOf("month").format("YYYY-MM-DD");
        const nextMonthEnd = nextMonth.endOf("month").format("YYYY-MM-DD");
        const nextMonthLabel = nextMonth.locale("pt-br").format("MMMM [de] YYYY");
        const capitalizedNextMonth = nextMonthLabel.charAt(0).toUpperCase() + nextMonthLabel.slice(1);

        // Dias que faltam para o início do próximo mês
        const daysUntilNextMonth = dayjs(nextMonthStart).diff(today.startOf("day"), "day");

        // Verifica quais roles têm usuários cadastrados na congregação (para fallback do Admin)
        const allCongUsers = await userRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["roles"]
        });

        const hasManagerAssigned = (roleName: string) => {
            return allCongUsers.some(u => u.roles.some(r => r.name === roleName));
        };

        const hasAnyManagerRole = [
            "CLEANING_MANAGER",
            "FIELD_SERVICE_MANAGER",
            "PUBLIC_WITNESS_MANAGER",
            "MIDWEEK_MANAGER",
            "TALK_MANAGER"
        ].some(r => userRoles.includes(r));

        // Regra de elegibilidade do usuário para receber aviso de um módulo
        const userCanReceiveAlert = (roleRequired: string) => {
            if (userRoles.includes(roleRequired)) {
                return true;
            }
            // Se o usuário é Admin da Congregação e NÃO possui nenhuma role de manager associada,
            // e ninguém na congregação foi cadastrado para aquela função, ele é avisado como fallback.
            if (isAdminCongregation && !hasAnyManagerRole && !hasManagerAssigned(roleRequired)) {
                return true;
            }
            return false;
        };

        const alerts: IScheduleAlert[] = [];

        // 1. Limpeza
        if (config.cleaning_enabled && daysUntilNextMonth <= config.cleaning_days_before && userCanReceiveAlert("CLEANING_MANAGER")) {
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

        // 2. Serviço de Campo
        if (config.field_service_enabled && daysUntilNextMonth <= config.field_service_days_before && userCanReceiveAlert("FIELD_SERVICE_MANAGER")) {
            const templatesCount = await fieldServiceTemplateRepository.count({
                where: { congregation_id }
            });

            if (templatesCount > 0) {
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
                        title: "Saídas de Campo",
                        message: `A programação de saídas de campo de ${capitalizedNextMonth} ainda não foi gerada.`,
                        link: "/congregacao/saidas-campo",
                        actionLabel: "Gerar Escalas",
                        daysRemaining: daysUntilNextMonth,
                        severity: daysUntilNextMonth <= 7 ? "HIGH" : "MEDIUM"
                    });
                }
            }
        }

        // 3. Testemunho Público
        if (config.public_witnessing_enabled && daysUntilNextMonth <= config.public_witnessing_days_before && userCanReceiveAlert("PUBLIC_WITNESS_MANAGER")) {
            const arrangementsCount = await publicWitnessArrangementRepository.count({
                where: { congregation_id }
            });

            if (arrangementsCount > 0) {
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
                        message: `A escala de testemunho público de ${capitalizedNextMonth} ainda não foi preenchida.`,
                        link: "/testemunho-publico/escalas",
                        actionLabel: "Gerar Escala",
                        daysRemaining: daysUntilNextMonth,
                        severity: daysUntilNextMonth <= 7 ? "HIGH" : "MEDIUM"
                    });
                }
            }
        }

        // 4. Reunião de Meio de Semana (RVM)
        if (config.midweek_meeting_enabled && daysUntilNextMonth <= config.midweek_meeting_days_before && userCanReceiveAlert("MIDWEEK_MANAGER")) {
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

        // 5. Reunião de Fim de Semana (Discursos / Oradores)
        if (config.weekend_meeting_enabled && daysUntilNextMonth <= config.weekend_meeting_days_before && userCanReceiveAlert("TALK_MANAGER")) {
            const weekendSchedules = await weekendScheduleRepository
                .createQueryBuilder("ws")
                .where("ws.congregation_id = :congregation_id", { congregation_id })
                .andWhere("ws.date >= :start AND ws.date <= :end", { start: nextMonthStart, end: nextMonthEnd })
                .getMany();

            // Busca eventos especiais do próximo mês que possam afetar a reunião pública
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
                    link: "/reunioes/fimdesemana/administracao",
                    actionLabel: "Cadastrar Escala",
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
                        link: "/reunioes/fimdesemana/administracao",
                        actionLabel: "Definir Oradores",
                        daysRemaining: daysUntilNextMonth,
                        severity: "HIGH"
                    });
                }
            }
        }

        return res.status(200).json({
            alerts,
            totalAlerts: alerts.length
        });
    }
}
