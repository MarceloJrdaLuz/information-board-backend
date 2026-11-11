import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { Request, Response } from "express";
import { ScheduleReminderConfig } from "../../entities/ScheduleReminderConfig";
import { Situation } from "../../entities/Publisher";
import { BadRequestError } from "../../helpers/api-errors";
import { decoder } from "../../middlewares/permissions";
import { roleRepository } from "../../repositories/roleRepository";
import { scheduleReminderConfigRepository } from "../../repositories/scheduleReminderConfigRepository";
import { userRepository } from "../../repositories/userRepository";
import { scheduleReminderService } from "../../services/ScheduleReminderService";

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

        const currentUser = await decoder(req);
        const userRoles = currentUser.roles?.map(r => r.name) || [];
        const isAdminCongregation = userRoles.includes("ADMIN_CONGREGATION") || userRoles.includes("ADMIN");

        const allCongAlerts = await scheduleReminderService.getPendingAlertsForCongregation(congregation_id);

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

        const userCanReceiveAlert = (roleRequired: string) => {
            if (userRoles.includes(roleRequired)) {
                return true;
            }
            if (isAdminCongregation && !hasAnyManagerRole && !hasManagerAssigned(roleRequired)) {
                return true;
            }
            return false;
        };

        const alerts = allCongAlerts.filter(alert => userCanReceiveAlert(alert.roleRequired));

        return res.status(200).json({
            alerts,
            totalAlerts: alerts.length
        });
    }
}
