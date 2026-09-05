import { Request, Response } from "express";
import { AccessRequest, AccessRequestStatus } from "../../entities/AccessRequest";
import { CongregationType } from "../../entities/Congregation";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../helpers/api-errors";
import { decoder } from "../../middlewares/permissions";
import { accessRequestRepository } from "../../repositories/accessRequestRepository";
import { congregationRepository } from "../../repositories/congregationRepository";
import { userRepository } from "../../repositories/userRepository";
import { pushNotificationService } from "../../services/pushNotificationService";

class AccessRequestController {
    /**
     * Cria uma nova solicitação de acesso para uma congregação SYSTEM
     */
    async create(req: Request, res: Response) {
        const user = await decoder(req);
        const { congregation_id, message } = req.body;

        if (!congregation_id) {
            throw new BadRequestError("Congregação é obrigatória.");
        }

        const currentUser = await userRepository.findOne({
            where: { id: user.id },
            relations: ["congregation"],
        });

        if (!currentUser) {
            throw new NotFoundError("Usuário não encontrado.");
        }

        if (currentUser.congregation?.id) {
            throw new BadRequestError("Você já está vinculado a uma congregação.");
        }

        const congregation = await congregationRepository.findOne({
            where: { id: congregation_id, type: CongregationType.SYSTEM },
        });

        if (!congregation) {
            throw new NotFoundError("Congregação não encontrada ou não está disponível para solicitações.");
        }

        // Verifica se já existe solicitação pendente do usuário
        const pendingRequest = await accessRequestRepository.findOne({
            where: {
                user_id: user.id,
                status: AccessRequestStatus.PENDING,
            },
        });

        if (pendingRequest) {
            throw new BadRequestError("Você já possui uma solicitação de acesso pendente. Cancele a anterior se deseja solicitar para outra congregação.");
        }

        const accessRequest = accessRequestRepository.create({
            user_id: user.id,
            congregation_id: congregation.id,
            message: message ? String(message).trim() : null,
            status: AccessRequestStatus.PENDING,
        });

        const savedRequest = await accessRequestRepository.save(accessRequest);

        // Notificar administradores da congregação
        try {
            const admins = await userRepository
                .createQueryBuilder("user")
                .innerJoin("user.roles", "role")
                .innerJoin("user.congregation", "congregation")
                .where("congregation.id = :congregationId", { congregationId: congregation.id })
                .andWhere("role.name = :roleName", { roleName: "ADMIN_CONGREGATION" })
                .getMany();

            const requesterName = currentUser.fullName || currentUser.email;

            for (const admin of admins) {
                await pushNotificationService.sendToUser(admin.id, {
                    title: "Nova Solicitação de Acesso",
                    body: `${requesterName} solicitou entrada na congregação ${congregation.name}.`,
                    data: {
                        type: "ACCESS_REQUEST",
                        accessRequestId: savedRequest.id,
                        url: "/administracao/add-domain",
                    },
                });
            }
        } catch (notifErr) {
            console.error("Erro ao enviar notificações para administradores:", notifErr);
        }

        return res.status(201).json(savedRequest);
    }

    /**
     * Lista as solicitações do próprio usuário logado
     */
    async getMyRequests(req: Request, res: Response) {
        const user = await decoder(req);

        const requests = await accessRequestRepository.find({
            where: { user_id: user.id },
            relations: ["congregation"],
            order: { created_at: "DESC" },
        });

        return res.status(200).json(requests);
    }

    /**
     * Cancela a solicitação pendente do próprio usuário
     */
    async cancelMyRequest(req: Request, res: Response) {
        const user = await decoder(req);
        const id = req.params.request_id || req.params.id;

        const request = await accessRequestRepository.findOne({
            where: { id, user_id: user.id },
        });

        if (!request) {
            throw new NotFoundError("Solicitação não encontrada.");
        }

        if (request.status !== AccessRequestStatus.PENDING) {
            throw new BadRequestError("Apenas solicitações pendentes podem ser canceladas.");
        }

        request.status = AccessRequestStatus.CANCELED;
        await accessRequestRepository.save(request);

        return res.status(200).json({ message: "Solicitação cancelada com sucesso.", request });
    }

    /**
     * Lista solicitações de uma congregação (Para ADMIN e ADMIN_CONGREGATION)
     */
    async listByCongregation(req: Request, res: Response) {
        const user = await decoder(req);
        const { congregation_id } = req.params;

        const userRoles = user?.roles?.map((r) => r.name) || [];
        const isSuperAdmin = userRoles.includes("ADMIN");
        const isAdminCongregation = userRoles.includes("ADMIN_CONGREGATION");

        if (!isSuperAdmin && !isAdminCongregation) {
            throw new UnauthorizedError("Acesso negado.");
        }

        if (isAdminCongregation) {
            const userWithCong = await userRepository.findOne({
                where: { id: user.id },
                relations: ["congregation"],
            });
            if (userWithCong?.congregation?.id !== congregation_id) {
                throw new UnauthorizedError("Você não tem permissão para gerenciar esta congregação.");
            }
        }

        const requests = await accessRequestRepository.find({
            where: { congregation_id },
            relations: ["user", "user.profile", "reviewed_by"],
            order: { created_at: "DESC" },
        });

        // Ocultar hash de senhas de retorno por segurança
        const safeRequests = requests.map((item) => {
            if (item.user) {
                delete (item.user as any).password;
                delete (item.user as any).passwordResetToken;
                delete (item.user as any).passwordResetExpires;
            }
            if (item.reviewed_by) {
                delete (item.reviewed_by as any).password;
            }
            return item;
        });

        return res.status(200).json(safeRequests);
    }

    /**
     * Aprova uma solicitação de acesso
     */
    async approve(req: Request, res: Response) {
        const user = await decoder(req);
        const id = req.params.request_id || req.params.id;

        const request = await accessRequestRepository.findOne({
            where: { id },
            relations: ["user", "congregation"],
        });

        if (!request) {
            throw new NotFoundError("Solicitação não encontrada.");
        }

        if (request.status !== AccessRequestStatus.PENDING) {
            throw new BadRequestError("Esta solicitação já foi respondida.");
        }

        const userRoles = user?.roles?.map((r) => r.name) || [];
        const isSuperAdmin = userRoles.includes("ADMIN");
        const isAdminCongregation = userRoles.includes("ADMIN_CONGREGATION");

        if (!isSuperAdmin && !isAdminCongregation) {
            throw new UnauthorizedError("Você não tem permissão para gerenciar esta congregação.");
        }

        if (isAdminCongregation) {
            const userWithCong = await userRepository.findOne({
                where: { id: user.id },
                relations: ["congregation"],
            });
            if (userWithCong?.congregation?.id !== request.congregation_id) {
                throw new UnauthorizedError("Você não tem permissão para aprovar nesta congregação.");
            }
        }

        // Atribui congregação ao usuário
        const targetUser = await userRepository.findOne({
            where: { id: request.user_id },
        });

        if (!targetUser) {
            throw new NotFoundError("Usuário solicitante não encontrado.");
        }

        targetUser.congregation = request.congregation;
        await userRepository.save(targetUser);

        // Atualiza solicitação
        request.status = AccessRequestStatus.APPROVED;
        request.reviewed_by_user_id = user.id;
        await accessRequestRepository.save(request);

        // Notificar usuário aprovado
        try {
            await pushNotificationService.sendToUser(targetUser.id, {
                title: "Acesso Aprovado!",
                body: `Seu acesso à congregação ${request.congregation.name} foi aprovado.`,
                data: {
                    type: "ACCESS_REQUEST_APPROVED",
                    congregationId: request.congregation_id,
                    url: "/dashboard",
                },
            });
        } catch (notifErr) {
            console.error("Erro ao enviar notificação de aprovação:", notifErr);
        }

        return res.status(200).json({ message: "Solicitação aprovada com sucesso.", request });
    }

    /**
     * Rejeita uma solicitação de acesso
     */
    async reject(req: Request, res: Response) {
        const user = await decoder(req);
        const id = req.params.request_id || req.params.id;
        const { response_observation } = req.body;

        const request = await accessRequestRepository.findOne({
            where: { id },
            relations: ["user", "congregation"],
        });

        if (!request) {
            throw new NotFoundError("Solicitação não encontrada.");
        }

        if (request.status !== AccessRequestStatus.PENDING) {
            throw new BadRequestError("Esta solicitação já foi respondida.");
        }

        const userRoles = user?.roles?.map((r) => r.name) || [];
        const isSuperAdmin = userRoles.includes("ADMIN");
        const isAdminCongregation = userRoles.includes("ADMIN_CONGREGATION");

        if (!isSuperAdmin && !isAdminCongregation) {
            throw new UnauthorizedError("Você não tem permissão para gerenciar esta congregação.");
        }

        if (isAdminCongregation) {
            const userWithCong = await userRepository.findOne({
                where: { id: user.id },
                relations: ["congregation"],
            });
            if (userWithCong?.congregation?.id !== request.congregation_id) {
                throw new UnauthorizedError("Você não tem permissão para recusar nesta congregação.");
            }
        }

        // Atualiza solicitação
        request.status = AccessRequestStatus.REJECTED;
        request.response_observation = response_observation ? String(response_observation).trim() : null;
        request.reviewed_by_user_id = user.id;
        await accessRequestRepository.save(request);

        // Notificar usuário
        try {
            const reason = response_observation ? ` Motivo: ${response_observation}` : "";
            await pushNotificationService.sendToUser(request.user_id, {
                title: "Solicitação de Acesso Não Aprovada",
                body: `Sua solicitação para a congregação ${request.congregation.name} não foi aceita.${reason}`,
                data: {
                    type: "ACCESS_REQUEST_REJECTED",
                    congregationId: request.congregation_id,
                    url: "/dashboard",
                },
            });
        } catch (notifErr) {
            console.error("Erro ao enviar notificação de recusa:", notifErr);
        }

        return res.status(200).json({ message: "Solicitação recusada com sucesso.", request });
    }
}

export default new AccessRequestController();
