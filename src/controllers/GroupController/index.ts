import { Response } from "express-serve-static-core";
import { CustomRequest, CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest";
import { BodyAddPublishersGroupTypes, BodyGroupCreateTypes, BodyUpdateGroupOverseerTypes, ParamsAddPublishersGroupTypes, ParamsDeleteGroupTypes, ParamsGetGroupsTypes } from "./types";
import { congregationRepository } from "../../repositories/congregationRepository";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { groupOverseersRepository } from "../../repositories/groupOverseersRepository";
import { groupRepository } from "../../repositories/groupRepository";
import { messageErrors } from "../../helpers/messageErrors";
import { publisherRepository } from "../../repositories/publisherRepository";
import { GroupOverseers } from "../../entities/GroupOverseers";

class GroupController {
    async create(req: CustomRequest<BodyGroupCreateTypes>, res: Response) {
        const { name, number, congregation_id, publisher_id } = req.body;

        const congregation = await congregationRepository.findOneBy({ id: congregation_id });

        if (!congregation) throw new NotFoundError(messageErrors.notFound.congregation);

        if (!publisher_id) throw new BadRequestError("It is necessary to have a group overseer. Create one or provide the id.");

        const existingGroupNumber = await groupRepository.findOne({
            where: { congregation: { id: congregation_id }, number }
        });

        const existingGroupName = await groupRepository.findOne({
            where: { congregation: { id: congregation_id }, name }
        });

        if (existingGroupNumber) {
            throw new BadRequestError('One group with some number already exists in the congregation');
        }

        if (existingGroupName) {
            throw new BadRequestError('One group with some name already exists in the congregation');
        }

        const publisher = await publisherRepository.findOneBy({ id: publisher_id });

        if (!publisher) throw new NotFoundError(messageErrors.notFound.publisher);

        // Verificar se o publisher já é um grupo de supervisores em algum grupo existente
        const existingGroupWithPublisher = await groupRepository.findOne({
            where: { groupOverseers: { publisher: { id: publisher_id } } }
        });

        if (existingGroupWithPublisher) {
            throw new BadRequestError('The publisher is already a group overseer for another group');
        }

        // Crie o grupo de supervisores
        const newGroupOverseers = groupOverseersRepository.create({
            publisher
        });

        const groupOverseers = await groupOverseersRepository.save(newGroupOverseers);

        // Crie o grupo e associe-o ao supervisor
        const newGroup = groupRepository.create({
            name,
            number,
            congregation,
            groupOverseers: groupOverseers // Adicione o grupo de supervisores aqui
        });

        const newGroupWithOverseers = await groupRepository.save(newGroup);

        // Adicione o group_overseers_id ao publisher
        publisher.groupOverseers = groupOverseers;
        publisher.group = newGroupWithOverseers
        await publisherRepository.save(publisher);

        // Retorne a resposta JSON
        const { congregation: _, ...rest } = newGroupWithOverseers;
        return res.json(rest);
    }

    async getGroups(req: ParamsCustomRequest<ParamsGetGroupsTypes>, res: Response) {
        const { congregation_id } = req.params

        const groups = await groupRepository.find({
            where: {
                congregation: {
                    id: congregation_id
                }
            },
        })

        if (!groups) throw new NotFoundError(messageErrors.notFound.group)

        const groupWith = groups.map(group => {
            const { id, name, number, groupOverseers } = group;

            if (!groupOverseers) {
                // Handle the case where groupOverseers is null
                return {
                    id,
                    name,
                    number,
                    groupOverseers: null,
                };
            }

            const { id: groupOverseersId, publisher } = groupOverseers;

            if (!publisher) {
                // Handle the case where publisher is null
                return {
                    id,
                    name,
                    number,
                    groupOverseers: {
                        id: groupOverseersId ?? null,
                        congregation: null, // Set congregation to null if publisher is null
                    },
                };
            }

            const { congregation: _, id: __, ...rest } = publisher;

            return {
                id,
                name,
                number,
                groupOverseers: {
                    id: groupOverseersId ?? null,
                    ...rest
                },
            };
        });

        res.status(200).json(groupWith);
    }


    async addPublishersGroup(req: CustomRequestPT<ParamsAddPublishersGroupTypes, BodyAddPublishersGroupTypes>, res: Response) {
        const { group_id } = req.params
        const { publishers_ids } = req.body

        const group = await groupRepository.findOneBy({ id: group_id })

        if (!group) throw new NotFoundError(messageErrors.notFound.group)

        const publisherPromises = publishers_ids.map(async (publisher_id) => {
            const publisher = await publisherRepository.findOne({
                where: {
                    id: publisher_id
                }
            });

            if (publisher) {
                publisher.group = group
                return publisherRepository.save(publisher);
            } else {
                return null; // Tratar caso o publisher não seja encontrado
            }
        });

        // Aguardar a resolução de todas as promessas
        const updatedPublishers = await Promise.all(publisherPromises);

        res.send()
    }

    async updateGroupOverseer(req: CustomRequestPT<ParamsAddPublishersGroupTypes, BodyUpdateGroupOverseerTypes>, res: Response) {
        const { group_id } = req.params
        const { publisher_id } = req.body

        const group = await groupRepository.findOneBy({ id: group_id })

        if (!group) throw new NotFoundError(messageErrors.notFound.group)

        const publisher = await publisherRepository.findOneBy({ id: publisher_id });

        if (!publisher) throw new NotFoundError(messageErrors.notFound.publisher)

        const groupOverseerExists = await groupOverseersRepository.findOne({
            where: {
                publisher: {
                    id: publisher_id
                }
            }
        })

        console.log(groupOverseerExists)

        if (groupOverseerExists) {
            group.groupOverseers = groupOverseerExists
            publisher.groupOverseers = groupOverseerExists
            await groupRepository.save(group)
            await publisherRepository.save(publisher)
            return res.send()
        } else {
            const newGroupOverseer = groupOverseersRepository.create({
                publisher
            })
            await groupOverseersRepository.save(newGroupOverseer).then(async (suc) => {
                publisher.groupOverseers = suc
                group.groupOverseers = suc
                await groupRepository.save(group)
                await publisherRepository.save(publisher)
            })
            return res.send()
        }
    }

    async removePublishersGroup(req: CustomRequestPT<ParamsAddPublishersGroupTypes, BodyAddPublishersGroupTypes>, res: Response) {
        const { group_id } = req.params
        const { publishers_ids } = req.body

        const group = await groupRepository.findOneBy({ id: group_id })

        if (!group) throw new NotFoundError(messageErrors.notFound.group)

        const publisherPromises = publishers_ids.map(async (publisher_id) => {
            const publisher = await publisherRepository.findOne({
                where: {
                    id: publisher_id
                }
            });

            if (publisher) {
                publisher.group = null
                return publisherRepository.save(publisher);
            } else {
                return null; // Tratar caso o publisher não seja encontrado
            }
        });

        // Aguardar a resolução de todas as promessas
        await Promise.all(publisherPromises);

        res.send()
    }

    async delete(req: ParamsCustomRequest<ParamsDeleteGroupTypes>, res: Response) {
        const { group_id } = req.params

        const group = await groupRepository.findOneBy({ id: group_id })

        if (!group) {
            throw new NotFoundError(messageErrors.notFound.group)
        }

        const publishers = await publisherRepository.find({
            where: {
                group: {
                    id: group_id
                }
            }
        })

        for (const publisher of publishers) {
            publisher.group = null;
            // Salve as alterações no banco de dados
            await publisherRepository.save(publisher);
        }

        await groupRepository.remove(group)

        return res.status(200).end()
    }

}

export default new GroupController()
