import { Response } from "express-serve-static-core"
import moment from "moment-timezone"
import { In } from "typeorm"
import { HospitalityGroup } from "../../entities/HospitalityGroup."
import { Publisher } from "../../entities/Publisher"
import { BadRequestError, NotFoundError } from "../../helpers/api-errors"
import { messageErrors } from "../../helpers/messageErrors"
import { congregationRepository } from "../../repositories/congregationRepository"
import { publisherRepository } from "../../repositories/publisherRepository"
import { CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest"
import {
    BodyHospitalityGroupCreateTypes,
    BodyHospitalityGroupUpdateTypes,
    BodyReorderGroupsTypes,
    ParamsCreateHospitalityGroupTypes,
    ParamsGetHospitalityGroupsTypes,
    ParamsHospitalityGroupTypes
} from "./types"
import { hospitalityGroupRepository } from "../../repositories/hospitalityGroupRepository"

class HospitalityGroupController {
    async create(req: CustomRequestPT<ParamsCreateHospitalityGroupTypes, BodyHospitalityGroupCreateTypes>, res: Response) {
        const { congregation_id } = req.params
        const { name, position, publisherHost_id, next_reception, member_ids } = req.body
        const nextReceptionDate = next_reception ? moment(next_reception).format("YYYY-MM-DD") : null

        const congregation = await congregationRepository.findOneBy({ id: congregation_id })
        if (!congregation) throw new NotFoundError(messageErrors.notFound.congregation)

        let host = null
        if (publisherHost_id) {
            host = await publisherRepository.findOneBy({ id: publisherHost_id, congregation: { id: congregation.id } })
            if (!host) throw new NotFoundError(messageErrors.notFound.publisher)
        }

        let members: Publisher[] = []
        if (member_ids && member_ids.length > 0) {
            members = await publisherRepository.findBy({
                id: In(member_ids)
            })
            if (members.length !== member_ids.length) {
                throw new BadRequestError("Some members were not found")
            }
        }

        try {
            // Buscar todos os grupos da congregação para calcular posição
            const groups = await hospitalityGroupRepository.find({
                where: { congregation: { id: congregation.id } },
                order: { position: "ASC" }
            });

            const finalPosition = position && position > 0
                ? position
                : (groups.length > 0 ? (groups[groups.length - 1].position ?? 0) + 1 : 1);

            const trimmedName = name?.trim();
            const finalName = trimmedName || `Grupo ${finalPosition}`;

            // Valida duplicidade de nome personalizado (ignora nomes padrão "Grupo X")
            if (trimmedName && !/^grupo\s*\d+$/i.test(trimmedName)) {
                const existingWithName = groups.find(
                    g => g.name.trim().toLowerCase() === trimmedName.toLowerCase()
                );
                if (existingWithName) {
                    throw new BadRequestError("Já existe um grupo com este nome nesta congregação");
                }
            }

            const newGroup = hospitalityGroupRepository.create({
                name: finalName,
                congregation,
                host,
                next_reception: nextReceptionDate || null,
                position: finalPosition,
                members,
            });

            await hospitalityGroupRepository.save(newGroup);
            return res.status(201).json(newGroup);
        } catch (error: any) {
            if (error.code === "23505") { // Postgres unique violation
                throw new BadRequestError("Já existe um grupo com este nome nesta congregação");
            }
            throw error; // repassa para middleware global
        }

    }

    async update(req: CustomRequestPT<ParamsHospitalityGroupTypes, BodyHospitalityGroupUpdateTypes>, res: Response) {
        const { hospitalityGroup_id } = req.params
        const { publisherHost_id, next_reception, member_ids, name } = req.body

        const nextReceptionDate = next_reception ? moment(next_reception).format("YYYY-MM-DD") : null

        const group = await hospitalityGroupRepository.findOne({
            where: { id: hospitalityGroup_id },
            relations: ["congregation", "host", "members"],
        })
        if (!group) throw new NotFoundError(messageErrors.notFound.groupHospitality)

        if (publisherHost_id !== undefined) {
            if (publisherHost_id === null) {
                group.host = null
            } else {
                const host = await publisherRepository.findOneBy({ id: publisherHost_id })
                if (!host) throw new NotFoundError(messageErrors.notFound.publisher)
                group.host = host
            }
        }

        if (name !== undefined) {
            const trimmed = name.trim();
            group.name = trimmed || `Grupo ${group.position ?? 1}`;
        }

        if (next_reception !== undefined) {
            group.next_reception = nextReceptionDate
        }

        if (member_ids !== undefined) {
            // Determinar qual será o host final (novo ou já existente)
            const currentHostId = publisherHost_id !== undefined
                ? publisherHost_id // novo host enviado no body (pode ser null também)
                : group.host?.id   // host já definido no grupo

            // Se tiver host, remover ele da lista de membros
            const filteredMemberIds = currentHostId
                ? member_ids.filter(id => id !== currentHostId)
                : member_ids

            if (filteredMemberIds.length === 0) {
                group.members = []
            } else {
                const members = await publisherRepository.findBy({
                    id: In(filteredMemberIds)
                })
                if (members.length !== filteredMemberIds.length) {
                    throw new BadRequestError("Some members were not found")
                }
                group.members = members
            }
        }

        try {
            await hospitalityGroupRepository.save(group)
            return res.json(group)
        } catch (error: any) {
            if (error.code === "23505") { // Postgres unique violation
                throw new BadRequestError("Já existe um grupo com este nome nesta congregação")
            }
            throw error
        }
    }

    async delete(req: ParamsCustomRequest<ParamsHospitalityGroupTypes>, res: Response) {
        const { hospitalityGroup_id } = req.params

        const group = await hospitalityGroupRepository.findOne({
            where: { id: hospitalityGroup_id },
            relations: ["congregation"]
        })
        if (!group) throw new NotFoundError(messageErrors.notFound.groupHospitality)

        const congregationId = group.congregation?.id

        await hospitalityGroupRepository.remove(group)

        // Se houver congregação, reordenar e renomear os grupos restantes
        if (congregationId) {
            const remainingGroups = await hospitalityGroupRepository.find({
                where: { congregation: { id: congregationId } },
                order: { position: "ASC" }
            })

            const updatedGroups: HospitalityGroup[] = []
            for (let i = 0; i < remainingGroups.length; i++) {
                const g = remainingGroups[i]
                const newPos = i + 1
                const isDefaultName = !g.name || /^grupo\s*\d+$/i.test(g.name.trim())

                let changed = false
                if (g.position !== newPos) {
                    g.position = newPos
                    changed = true
                }
                if (isDefaultName && g.name !== `Grupo ${newPos}`) {
                    g.name = `Grupo ${newPos}`
                    changed = true
                }

                if (changed) {
                    updatedGroups.push(g)
                }
            }

            if (updatedGroups.length > 0) {
                await hospitalityGroupRepository.save(updatedGroups)
            }
        }

        return res.status(200).end()
    }

    async getHospitalityGroups(req: ParamsCustomRequest<ParamsGetHospitalityGroupsTypes>, res: Response) {
        const { congregation_id } = req.params

        const groups = await hospitalityGroupRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["host", "members"],
            order: { position: "ASC" },
        })

        return res.json(groups)
    }

    async getHospitalityGroup(req: ParamsCustomRequest<ParamsHospitalityGroupTypes>, res: Response) {
        const { hospitalityGroup_id } = req.params

        const group = await hospitalityGroupRepository.findOne({
            where: { id: hospitalityGroup_id },
            relations: ["host", "members"],
        })
        if (!group) throw new NotFoundError(messageErrors.notFound.groupHospitality)

        return res.json(group)
    }

    async reorderGroups(req: CustomRequestPT<ParamsCreateHospitalityGroupTypes, BodyReorderGroupsTypes>, res: Response) {
        const { congregation_id } = req.params
        const { orderedGroupIds } = req.body

        if (!orderedGroupIds || orderedGroupIds.length === 0) {
            throw new BadRequestError("The list of groups cannot be empty")
        }

        // Buscar todos os grupos da congregação
        const groups = await hospitalityGroupRepository.find({
            where: { congregation: { id: congregation_id } },
        })

        if (groups.length !== orderedGroupIds.length) {
            throw new BadRequestError("Group list length does not match congregation group count")
        }

        // Mapear grupos por id para fácil acesso
        const groupMap = new Map(groups.map(g => [g.id, g]))

        const updatedGroups: HospitalityGroup[] = []

        // Atualiza a posição de cada grupo de acordo com a ordem recebida
        orderedGroupIds.forEach((id, index) => {
            const group = groupMap.get(id)
            if (!group) {
                throw new NotFoundError(`GroupHospitality ${id} not found in this congregation`)
            }
            const newPos = index + 1 // posição começa em 1
            const isDefaultName = !group.name || /^grupo\s*\d+$/i.test(group.name.trim())

            group.position = newPos
            if (isDefaultName) {
                group.name = `Grupo ${newPos}`
            }
            updatedGroups.push(group)
        })

        // Salva todas as alterações em uma única operação
        await hospitalityGroupRepository.save(updatedGroups)

        return res.status(200).json(updatedGroups)
    }
}

export default new HospitalityGroupController()
