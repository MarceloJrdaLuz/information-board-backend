import dayjs from "dayjs";
import { Request, Response } from "express";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../helpers/api-errors";
import { decoder } from "../../middlewares/permissions";
import { cleaningGroupRepository } from "../../repositories/cleaningGroupRepository";
import { cleaningGroupUnavailabilityRepository } from "../../repositories/cleaningGroupUnavailabilityRepository";
import { congregationRepository } from "../../repositories/congregationRepository";
import { userRepository } from "../../repositories/userRepository";
import { ParamsCustomRequest } from "../../types/customRequest";

interface CreateUnavailabilityBody {
    group_id: string;
    startDate: string;
    endDate: string;
    reason?: string;
}

class CleaningGroupUnavailabilityController {
    async create(
        req: ParamsCustomRequest<{ congregation_id: string }>,
        res: Response
    ) {
        const { congregation_id } = req.params;
        const { group_id, startDate, endDate, reason } = req.body as CreateUnavailabilityBody;

        if (!group_id || !startDate || !endDate) {
            throw new BadRequestError("group_id, startDate e endDate são obrigatórios.");
        }

        const start = dayjs(startDate);
        const end = dayjs(endDate);

        if (!start.isValid() || !end.isValid()) {
            throw new BadRequestError("Formato de data inválido. Use YYYY-MM-DD.");
        }

        if (end.isBefore(start)) {
            throw new BadRequestError("A data final não pode ser anterior à data inicial.");
        }

        const congregation = await congregationRepository.findOne({
            where: { id: congregation_id }
        });

        if (!congregation) {
            throw new NotFoundError("Congregação não encontrada.");
        }

        const group = await cleaningGroupRepository.findOne({
            where: { id: group_id, congregation: { id: congregation_id } }
        });

        if (!group) {
            throw new NotFoundError("Grupo de limpeza não encontrado nesta congregação.");
        }

        const unavailability = cleaningGroupUnavailabilityRepository.create({
            congregation_id,
            congregation,
            group_id,
            group,
            startDate: start.format("YYYY-MM-DD"),
            endDate: end.format("YYYY-MM-DD"),
            reason: reason || null
        });

        await cleaningGroupUnavailabilityRepository.save(unavailability);

        return res.status(201).json(unavailability);
    }

    async getByCongregation(
        req: ParamsCustomRequest<{ congregation_id: string }>,
        res: Response
    ) {
        const { congregation_id } = req.params;

        const unavailabilities = await cleaningGroupUnavailabilityRepository.find({
            where: { congregation_id },
            relations: ["group"],
            order: { startDate: "ASC" }
        });

        return res.status(200).json(unavailabilities);
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;

        const unavailability = await cleaningGroupUnavailabilityRepository.findOne({
            where: { id },
            relations: ["congregation"]
        });

        if (!unavailability) {
            throw new NotFoundError("Indisponibilidade de grupo não encontrada.");
        }

        const user = await decoder(req);
        const userRoles = user?.roles?.map(role => role.name);
        if (!userRoles?.includes("ADMIN")) {
            const userCongregation = await userRepository.find({
                where: {
                    id: user.id,
                    congregation: { id: unavailability.congregation_id }
                }
            });

            if (userCongregation.length < 1) {
                throw new UnauthorizedError("Usuário não tem permissão nesta congregação.");
            }
        }

        await cleaningGroupUnavailabilityRepository.delete(id);
        return res.status(204).send();
    }
}

export default new CleaningGroupUnavailabilityController();

