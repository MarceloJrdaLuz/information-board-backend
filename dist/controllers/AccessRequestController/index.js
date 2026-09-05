"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AccessRequest_1 = require("../../entities/AccessRequest");
const Congregation_1 = require("../../entities/Congregation");
const api_errors_1 = require("../../helpers/api-errors");
const permissions_1 = require("../../middlewares/permissions");
const accessRequestRepository_1 = require("../../repositories/accessRequestRepository");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const userRepository_1 = require("../../repositories/userRepository");
const pushNotificationService_1 = require("../../services/pushNotificationService");
class AccessRequestController {
    /**
     * Cria uma nova solicitação de acesso para uma congregação SYSTEM
     */
    async create(req, res) {
        var _a;
        const user = await (0, permissions_1.decoder)(req);
        const { congregation_id, message } = req.body;
        if (!congregation_id) {
            throw new api_errors_1.BadRequestError("Congregação é obrigatória.");
        }
        const currentUser = await userRepository_1.userRepository.findOne({
            where: { id: user.id },
            relations: ["congregation"],
        });
        if (!currentUser) {
            throw new api_errors_1.NotFoundError("Usuário não encontrado.");
        }
        if ((_a = currentUser.congregation) === null || _a === void 0 ? void 0 : _a.id) {
            throw new api_errors_1.BadRequestError("Você já está vinculado a uma congregação.");
        }
        const congregation = await congregationRepository_1.congregationRepository.findOne({
            where: { id: congregation_id, type: Congregation_1.CongregationType.SYSTEM },
        });
        if (!congregation) {
            throw new api_errors_1.NotFoundError("Congregação não encontrada ou não está disponível para solicitações.");
        }
        // Verifica se já existe solicitação pendente do usuário
        const pendingRequest = await accessRequestRepository_1.accessRequestRepository.findOne({
            where: {
                user_id: user.id,
                status: AccessRequest_1.AccessRequestStatus.PENDING,
            },
        });
        if (pendingRequest) {
            throw new api_errors_1.BadRequestError("Você já possui uma solicitação de acesso pendente. Cancele a anterior se deseja solicitar para outra congregação.");
        }
        const accessRequest = accessRequestRepository_1.accessRequestRepository.create({
            user_id: user.id,
            congregation_id: congregation.id,
            message: message ? String(message).trim() : null,
            status: AccessRequest_1.AccessRequestStatus.PENDING,
        });
        const savedRequest = await accessRequestRepository_1.accessRequestRepository.save(accessRequest);
        // Notificar administradores da congregação
        try {
            const admins = await userRepository_1.userRepository
                .createQueryBuilder("user")
                .innerJoin("user.roles", "role")
                .innerJoin("user.congregation", "congregation")
                .where("congregation.id = :congregationId", { congregationId: congregation.id })
                .andWhere("role.name = :roleName", { roleName: "ADMIN_CONGREGATION" })
                .getMany();
            const requesterName = currentUser.fullName || currentUser.email;
            for (const admin of admins) {
                await pushNotificationService_1.pushNotificationService.sendToUser(admin.id, {
                    title: "Nova Solicitação de Acesso",
                    body: `${requesterName} solicitou entrada na congregação ${congregation.name}.`,
                    data: {
                        type: "ACCESS_REQUEST",
                        accessRequestId: savedRequest.id,
                        url: "/administracao/add-domain",
                    },
                });
            }
        }
        catch (notifErr) {
            console.error("Erro ao enviar notificações para administradores:", notifErr);
        }
        return res.status(201).json(savedRequest);
    }
    /**
     * Lista as solicitações do próprio usuário logado
     */
    async getMyRequests(req, res) {
        const user = await (0, permissions_1.decoder)(req);
        const requests = await accessRequestRepository_1.accessRequestRepository.find({
            where: { user_id: user.id },
            relations: ["congregation"],
            order: { created_at: "DESC" },
        });
        return res.status(200).json(requests);
    }
    /**
     * Cancela a solicitação pendente do próprio usuário
     */
    async cancelMyRequest(req, res) {
        const user = await (0, permissions_1.decoder)(req);
        const id = req.params.request_id || req.params.id;
        const request = await accessRequestRepository_1.accessRequestRepository.findOne({
            where: { id, user_id: user.id },
        });
        if (!request) {
            throw new api_errors_1.NotFoundError("Solicitação não encontrada.");
        }
        if (request.status !== AccessRequest_1.AccessRequestStatus.PENDING) {
            throw new api_errors_1.BadRequestError("Apenas solicitações pendentes podem ser canceladas.");
        }
        request.status = AccessRequest_1.AccessRequestStatus.CANCELED;
        await accessRequestRepository_1.accessRequestRepository.save(request);
        return res.status(200).json({ message: "Solicitação cancelada com sucesso.", request });
    }
    /**
     * Lista solicitações de uma congregação (Para ADMIN e ADMIN_CONGREGATION)
     */
    async listByCongregation(req, res) {
        var _a, _b;
        const user = await (0, permissions_1.decoder)(req);
        const { congregation_id } = req.params;
        const userRoles = ((_a = user === null || user === void 0 ? void 0 : user.roles) === null || _a === void 0 ? void 0 : _a.map((r) => r.name)) || [];
        const isSuperAdmin = userRoles.includes("ADMIN");
        const isAdminCongregation = userRoles.includes("ADMIN_CONGREGATION");
        if (!isSuperAdmin && !isAdminCongregation) {
            throw new api_errors_1.UnauthorizedError("Acesso negado.");
        }
        if (isAdminCongregation) {
            const userWithCong = await userRepository_1.userRepository.findOne({
                where: { id: user.id },
                relations: ["congregation"],
            });
            if (((_b = userWithCong === null || userWithCong === void 0 ? void 0 : userWithCong.congregation) === null || _b === void 0 ? void 0 : _b.id) !== congregation_id) {
                throw new api_errors_1.UnauthorizedError("Você não tem permissão para gerenciar esta congregação.");
            }
        }
        const requests = await accessRequestRepository_1.accessRequestRepository.find({
            where: { congregation_id },
            relations: ["user", "user.profile", "reviewed_by"],
            order: { created_at: "DESC" },
        });
        // Ocultar hash de senhas de retorno por segurança
        const safeRequests = requests.map((item) => {
            if (item.user) {
                delete item.user.password;
                delete item.user.passwordResetToken;
                delete item.user.passwordResetExpires;
            }
            if (item.reviewed_by) {
                delete item.reviewed_by.password;
            }
            return item;
        });
        return res.status(200).json(safeRequests);
    }
    /**
     * Aprova uma solicitação de acesso
     */
    async approve(req, res) {
        var _a, _b;
        const user = await (0, permissions_1.decoder)(req);
        const id = req.params.request_id || req.params.id;
        const request = await accessRequestRepository_1.accessRequestRepository.findOne({
            where: { id },
            relations: ["user", "congregation"],
        });
        if (!request) {
            throw new api_errors_1.NotFoundError("Solicitação não encontrada.");
        }
        if (request.status !== AccessRequest_1.AccessRequestStatus.PENDING) {
            throw new api_errors_1.BadRequestError("Esta solicitação já foi respondida.");
        }
        const userRoles = ((_a = user === null || user === void 0 ? void 0 : user.roles) === null || _a === void 0 ? void 0 : _a.map((r) => r.name)) || [];
        const isSuperAdmin = userRoles.includes("ADMIN");
        const isAdminCongregation = userRoles.includes("ADMIN_CONGREGATION");
        if (!isSuperAdmin && !isAdminCongregation) {
            throw new api_errors_1.UnauthorizedError("Você não tem permissão para gerenciar esta congregação.");
        }
        if (isAdminCongregation) {
            const userWithCong = await userRepository_1.userRepository.findOne({
                where: { id: user.id },
                relations: ["congregation"],
            });
            if (((_b = userWithCong === null || userWithCong === void 0 ? void 0 : userWithCong.congregation) === null || _b === void 0 ? void 0 : _b.id) !== request.congregation_id) {
                throw new api_errors_1.UnauthorizedError("Você não tem permissão para aprovar nesta congregação.");
            }
        }
        // Atribui congregação ao usuário
        const targetUser = await userRepository_1.userRepository.findOne({
            where: { id: request.user_id },
        });
        if (!targetUser) {
            throw new api_errors_1.NotFoundError("Usuário solicitante não encontrado.");
        }
        targetUser.congregation = request.congregation;
        await userRepository_1.userRepository.save(targetUser);
        // Atualiza solicitação
        request.status = AccessRequest_1.AccessRequestStatus.APPROVED;
        request.reviewed_by_user_id = user.id;
        await accessRequestRepository_1.accessRequestRepository.save(request);
        // Notificar usuário aprovado
        try {
            await pushNotificationService_1.pushNotificationService.sendToUser(targetUser.id, {
                title: "Acesso Aprovado!",
                body: `Seu acesso à congregação ${request.congregation.name} foi aprovado.`,
                data: {
                    type: "ACCESS_REQUEST_APPROVED",
                    congregationId: request.congregation_id,
                    url: "/dashboard",
                },
            });
        }
        catch (notifErr) {
            console.error("Erro ao enviar notificação de aprovação:", notifErr);
        }
        return res.status(200).json({ message: "Solicitação aprovada com sucesso.", request });
    }
    /**
     * Rejeita uma solicitação de acesso
     */
    async reject(req, res) {
        var _a, _b;
        const user = await (0, permissions_1.decoder)(req);
        const id = req.params.request_id || req.params.id;
        const { response_observation } = req.body;
        const request = await accessRequestRepository_1.accessRequestRepository.findOne({
            where: { id },
            relations: ["user", "congregation"],
        });
        if (!request) {
            throw new api_errors_1.NotFoundError("Solicitação não encontrada.");
        }
        if (request.status !== AccessRequest_1.AccessRequestStatus.PENDING) {
            throw new api_errors_1.BadRequestError("Esta solicitação já foi respondida.");
        }
        const userRoles = ((_a = user === null || user === void 0 ? void 0 : user.roles) === null || _a === void 0 ? void 0 : _a.map((r) => r.name)) || [];
        const isSuperAdmin = userRoles.includes("ADMIN");
        const isAdminCongregation = userRoles.includes("ADMIN_CONGREGATION");
        if (!isSuperAdmin && !isAdminCongregation) {
            throw new api_errors_1.UnauthorizedError("Você não tem permissão para gerenciar esta congregação.");
        }
        if (isAdminCongregation) {
            const userWithCong = await userRepository_1.userRepository.findOne({
                where: { id: user.id },
                relations: ["congregation"],
            });
            if (((_b = userWithCong === null || userWithCong === void 0 ? void 0 : userWithCong.congregation) === null || _b === void 0 ? void 0 : _b.id) !== request.congregation_id) {
                throw new api_errors_1.UnauthorizedError("Você não tem permissão para recusar nesta congregação.");
            }
        }
        // Atualiza solicitação
        request.status = AccessRequest_1.AccessRequestStatus.REJECTED;
        request.response_observation = response_observation ? String(response_observation).trim() : null;
        request.reviewed_by_user_id = user.id;
        await accessRequestRepository_1.accessRequestRepository.save(request);
        // Notificar usuário
        try {
            const reason = response_observation ? ` Motivo: ${response_observation}` : "";
            await pushNotificationService_1.pushNotificationService.sendToUser(request.user_id, {
                title: "Solicitação de Acesso Não Aprovada",
                body: `Sua solicitação para a congregação ${request.congregation.name} não foi aceita.${reason}`,
                data: {
                    type: "ACCESS_REQUEST_REJECTED",
                    congregationId: request.congregation_id,
                    url: "/dashboard",
                },
            });
        }
        catch (notifErr) {
            console.error("Erro ao enviar notificação de recusa:", notifErr);
        }
        return res.status(200).json({ message: "Solicitação recusada com sucesso.", request });
    }
}
exports.default = new AccessRequestController();
