"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleReminderController = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
require("dayjs/locale/pt-br");
const ScheduleReminderConfig_1 = require("../../entities/ScheduleReminderConfig");
const Publisher_1 = require("../../entities/Publisher");
const api_errors_1 = require("../../helpers/api-errors");
const permissions_1 = require("../../middlewares/permissions");
const cleaningGroupRepository_1 = require("../../repositories/cleaningGroupRepository");
const cleaningScheduleRepository_1 = require("../../repositories/cleaningScheduleRepository");
const fieldServiceScheduleRepository_1 = require("../../repositories/fieldServiceScheduleRepository");
const fieldServiceTemplateRepository_1 = require("../../repositories/fieldServiceTemplateRepository");
const midweekScheduleRepository_1 = require("../../repositories/midweekScheduleRepository");
const publicWitnessAssignmentRepository_1 = require("../../repositories/publicWitnessAssignmentRepository");
const publicWitnessTimeSlotRepository_1 = require("../../repositories/publicWitnessTimeSlotRepository");
const roleRepository_1 = require("../../repositories/roleRepository");
const scheduleReminderConfigRepository_1 = require("../../repositories/scheduleReminderConfigRepository");
const userRepository_1 = require("../../repositories/userRepository");
const weekendScheduleRepository_1 = require("../../repositories/weekendScheduleRepository");
const specialEventRepository_1 = require("../../repositories/specialEventRepository");
dayjs_1.default.locale("pt-br");
function getDefaultConfig(congregation_id) {
    const config = new ScheduleReminderConfig_1.ScheduleReminderConfig();
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
class ScheduleReminderController {
    async getConfig(req, res) {
        const { congregation_id } = req.params;
        if (!congregation_id) {
            throw new api_errors_1.BadRequestError("congregation_id is required");
        }
        let config = await scheduleReminderConfigRepository_1.scheduleReminderConfigRepository.findOne({
            where: { congregation_id }
        });
        if (!config) {
            config = getDefaultConfig(congregation_id);
        }
        return res.status(200).json(config);
    }
    async updateConfig(req, res) {
        const { congregation_id } = req.params;
        if (!congregation_id) {
            throw new api_errors_1.BadRequestError("congregation_id is required");
        }
        let config = await scheduleReminderConfigRepository_1.scheduleReminderConfigRepository.findOne({
            where: { congregation_id }
        });
        if (!config) {
            config = getDefaultConfig(congregation_id);
        }
        scheduleReminderConfigRepository_1.scheduleReminderConfigRepository.merge(config, req.body);
        const saved = await scheduleReminderConfigRepository_1.scheduleReminderConfigRepository.save(config);
        return res.status(200).json(saved);
    }
    async getResponsibles(req, res) {
        const { congregation_id } = req.params;
        if (!congregation_id) {
            throw new api_errors_1.BadRequestError("congregation_id is required");
        }
        // Busca todos os usuários da congregação com suas roles e publisher
        const users = await userRepository_1.userRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["roles", "publisher", "publisher.congregation"]
        });
        // Filtra para exibir APENAS publicadores que ainda pertencem à congregação e estão ativos
        const activeCongregationUsers = users.filter(u => {
            var _a;
            if (!u.publisher)
                return false;
            const pubCongId = ((_a = u.publisher.congregation) === null || _a === void 0 ? void 0 : _a.id) || u.publisher.congregation_id;
            if (pubCongId && pubCongId !== congregation_id) {
                return false;
            }
            if (u.publisher.situation === Publisher_1.Situation.Removido || u.publisher.situation === Publisher_1.Situation.Desassociado) {
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
        const responsiblesByRole = {
            CLEANING_MANAGER: [],
            FIELD_SERVICE_MANAGER: [],
            PUBLIC_WITNESS_MANAGER: [],
            MIDWEEK_MANAGER: [],
            TALK_MANAGER: []
        };
        activeCongregationUsers.forEach(u => {
            var _a, _b;
            const displayName = ((_a = u.publisher) === null || _a === void 0 ? void 0 : _a.fullName) || u.fullName || u.email;
            const roleNames = ((_b = u.roles) === null || _b === void 0 ? void 0 : _b.map(r => r.name)) || [];
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
            .map(u => {
            var _a;
            return ({
                id: u.id,
                name: ((_a = u.publisher) === null || _a === void 0 ? void 0 : _a.fullName) || u.fullName || u.email,
                email: u.email
            });
        })
            .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
        return res.status(200).json({
            responsiblesByRole,
            availableUsers: allAvailableUsers
        });
    }
    async updateResponsibles(req, res) {
        const { congregation_id } = req.params;
        const { roleName, userIds } = req.body;
        if (!congregation_id || !roleName || !Array.isArray(userIds)) {
            throw new api_errors_1.BadRequestError("congregation_id, roleName and userIds are required");
        }
        const allowedRoles = [
            "CLEANING_MANAGER",
            "FIELD_SERVICE_MANAGER",
            "PUBLIC_WITNESS_MANAGER",
            "MIDWEEK_MANAGER",
            "TALK_MANAGER"
        ];
        if (!allowedRoles.includes(roleName)) {
            throw new api_errors_1.BadRequestError(`Invalid roleName. Allowed: ${allowedRoles.join(", ")}`);
        }
        let targetRole = await roleRepository_1.roleRepository.findOne({ where: { name: roleName } });
        if (!targetRole) {
            const descriptions = {
                CLEANING_MANAGER: "Gerenciador de Limpeza",
                FIELD_SERVICE_MANAGER: "Gerenciador de Campo",
                PUBLIC_WITNESS_MANAGER: "Gerenciador de Testemunho Público",
                MIDWEEK_MANAGER: "Gerenciador de Reunião Meio de Semana",
                TALK_MANAGER: "Gerenciador de Discursos"
            };
            targetRole = roleRepository_1.roleRepository.create({
                name: roleName,
                description: descriptions[roleName] || `Gerenciador de ${roleName}`,
                permissions: []
            });
            await roleRepository_1.roleRepository.save(targetRole);
        }
        const congregationUsers = await userRepository_1.userRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["roles"]
        });
        for (const user of congregationUsers) {
            const shouldHave = userIds.includes(user.id);
            const currentlyHas = user.roles.some(r => r.name === roleName);
            if (shouldHave && !currentlyHas) {
                user.roles.push(targetRole);
                await userRepository_1.userRepository.save(user);
            }
            else if (!shouldHave && currentlyHas) {
                user.roles = user.roles.filter(r => r.name !== roleName);
                await userRepository_1.userRepository.save(user);
            }
        }
        return res.status(200).json({ message: "Responsáveis atualizados com sucesso!" });
    }
    async getAlerts(req, res) {
        var _a;
        const { congregation_id } = req.params;
        if (!congregation_id) {
            throw new api_errors_1.BadRequestError("congregation_id is required");
        }
        // Obtém o usuário que fez a requisição
        const currentUser = await (0, permissions_1.decoder)(req);
        const userRoles = ((_a = currentUser.roles) === null || _a === void 0 ? void 0 : _a.map(r => r.name)) || [];
        const isAdminCongregation = userRoles.includes("ADMIN_CONGREGATION") || userRoles.includes("ADMIN");
        // Carrega configurações de lembrete
        let config = await scheduleReminderConfigRepository_1.scheduleReminderConfigRepository.findOne({
            where: { congregation_id }
        });
        if (!config) {
            config = getDefaultConfig(congregation_id);
        }
        const today = (0, dayjs_1.default)();
        const nextMonth = today.add(1, "month");
        const nextMonthStart = nextMonth.startOf("month").format("YYYY-MM-DD");
        const nextMonthEnd = nextMonth.endOf("month").format("YYYY-MM-DD");
        const nextMonthLabel = nextMonth.locale("pt-br").format("MMMM [de] YYYY");
        const capitalizedNextMonth = nextMonthLabel.charAt(0).toUpperCase() + nextMonthLabel.slice(1);
        // Dias que faltam para o início do próximo mês
        const daysUntilNextMonth = (0, dayjs_1.default)(nextMonthStart).diff(today.startOf("day"), "day");
        // Verifica quais roles têm usuários cadastrados na congregação (para fallback do Admin)
        const allCongUsers = await userRepository_1.userRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["roles"]
        });
        const hasManagerAssigned = (roleName) => {
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
        const userCanReceiveAlert = (roleRequired) => {
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
        const alerts = [];
        // 1. Limpeza
        if (config.cleaning_enabled && daysUntilNextMonth <= config.cleaning_days_before && userCanReceiveAlert("CLEANING_MANAGER")) {
            // Se a congregação nunca cadastrou grupos nem gerou escalas de limpeza, ela não utiliza o módulo
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
        if (config.field_service_enabled && daysUntilNextMonth <= config.field_service_days_before && userCanReceiveAlert("FIELD_SERVICE_MANAGER")) {
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
            // Verifica se a congregação possui horários em modo RODÍZIO (is_rotative = true).
            // Se possuir apenas arranjos fixos (ou nenhum arranjo), não há necessidade de escala mensal.
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
                    .andWhere("ts.is_rotative = true")
                    .andWhere("pwa.date >= :start AND pwa.date <= :end", { start: nextMonthStart, end: nextMonthEnd })
                    .getCount();
                if (assignmentsCount === 0) {
                    alerts.push({
                        id: "public_witness",
                        module: "PUBLIC_WITNESS",
                        roleRequired: "PUBLIC_WITNESS_MANAGER",
                        title: "Testemunho Público",
                        message: `A escala de rodízio de testemunho público de ${capitalizedNextMonth} ainda não foi gerada.`,
                        link: "/congregacao/testemunho-publico",
                        actionLabel: "Gerar Escala",
                        daysRemaining: daysUntilNextMonth,
                        severity: daysUntilNextMonth <= 7 ? "HIGH" : "MEDIUM"
                    });
                }
            }
        }
        // 4. Reunião de Meio de Semana (RVM)
        if (config.midweek_meeting_enabled && daysUntilNextMonth <= config.midweek_meeting_days_before && userCanReceiveAlert("MIDWEEK_MANAGER")) {
            // Se a congregação nunca cadastrou nenhuma semana de meio de semana, ela não utiliza o módulo
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
        if (config.weekend_meeting_enabled && daysUntilNextMonth <= config.weekend_meeting_days_before && userCanReceiveAlert("TALK_MANAGER")) {
            // Se a congregação nunca cadastrou nenhuma escala de fim de semana, ela não utiliza o módulo
            const totalWeekendSchedules = await weekendScheduleRepository_1.weekendScheduleRepository.count({
                where: { congregation: { id: congregation_id } }
            });
            if (totalWeekendSchedules > 0) {
                const weekendSchedules = await weekendScheduleRepository_1.weekendScheduleRepository
                    .createQueryBuilder("ws")
                    .where("ws.congregation_id = :congregation_id", { congregation_id })
                    .andWhere("ws.date >= :start AND ws.date <= :end", { start: nextMonthStart, end: nextMonthEnd })
                    .getMany();
                // Busca eventos especiais do próximo mês que possam afetar a reunião pública
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
        return res.status(200).json({
            alerts,
            totalAlerts: alerts.length
        });
    }
}
exports.ScheduleReminderController = ScheduleReminderController;
