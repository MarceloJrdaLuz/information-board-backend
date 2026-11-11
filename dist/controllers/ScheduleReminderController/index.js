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
const roleRepository_1 = require("../../repositories/roleRepository");
const scheduleReminderConfigRepository_1 = require("../../repositories/scheduleReminderConfigRepository");
const userRepository_1 = require("../../repositories/userRepository");
const ScheduleReminderService_1 = require("../../services/ScheduleReminderService");
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
        const currentUser = await (0, permissions_1.decoder)(req);
        const userRoles = ((_a = currentUser.roles) === null || _a === void 0 ? void 0 : _a.map(r => r.name)) || [];
        const isAdminCongregation = userRoles.includes("ADMIN_CONGREGATION") || userRoles.includes("ADMIN");
        const allCongAlerts = await ScheduleReminderService_1.scheduleReminderService.getPendingAlertsForCongregation(congregation_id);
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
        const userCanReceiveAlert = (roleRequired) => {
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
exports.ScheduleReminderController = ScheduleReminderController;
