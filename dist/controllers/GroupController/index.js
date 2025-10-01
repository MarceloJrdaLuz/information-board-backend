"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const congregationRepository_1 = require("../../repositories/congregationRepository");
const api_errors_1 = require("../../helpers/api-errors");
const groupOverseersRepository_1 = require("../../repositories/groupOverseersRepository");
const groupRepository_1 = require("../../repositories/groupRepository");
const messageErrors_1 = require("../../helpers/messageErrors");
const publisherRepository_1 = require("../../repositories/publisherRepository");
class GroupController {
    async create(req, res) {
        const { name, number, congregation_id, publisher_id } = req.body;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        if (!publisher_id)
            throw new api_errors_1.BadRequestError("It is necessary to have a group overseer. Create one or provide the id.");
        const existingGroupNumber = await groupRepository_1.groupRepository.findOne({
            where: { congregation: { id: congregation_id }, number }
        });
        const existingGroupName = await groupRepository_1.groupRepository.findOne({
            where: { congregation: { id: congregation_id }, name }
        });
        if (existingGroupNumber) {
            throw new api_errors_1.BadRequestError('One group with some number already exists in the congregation');
        }
        if (existingGroupName) {
            throw new api_errors_1.BadRequestError('One group with some name already exists in the congregation');
        }
        const publisher = await publisherRepository_1.publisherRepository.findOneBy({ id: publisher_id });
        if (!publisher)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.publisher);
        // Verificar se o publisher já é um grupo de supervisores em algum grupo existente
        const existingGroupWithPublisher = await groupRepository_1.groupRepository.findOne({
            where: { groupOverseers: { publisher: { id: publisher_id } } }
        });
        if (existingGroupWithPublisher) {
            throw new api_errors_1.BadRequestError('The publisher is already a group overseer for another group');
        }
        // Crie o grupo de supervisores
        const newGroupOverseers = groupOverseersRepository_1.groupOverseersRepository.create({
            publisher
        });
        const groupOverseers = await groupOverseersRepository_1.groupOverseersRepository.save(newGroupOverseers);
        // Crie o grupo e associe-o ao supervisor
        const newGroup = groupRepository_1.groupRepository.create({
            name,
            number,
            congregation,
            groupOverseers: groupOverseers // Adicione o grupo de supervisores aqui
        });
        const newGroupWithOverseers = await groupRepository_1.groupRepository.save(newGroup);
        // Adicione o group_overseers_id ao publisher
        publisher.groupOverseers = groupOverseers;
        publisher.group = newGroupWithOverseers;
        await publisherRepository_1.publisherRepository.save(publisher);
        // Retorne a resposta JSON
        const { congregation: _, ...rest } = newGroupWithOverseers;
        return res.json(rest);
    }
    async getGroups(req, res) {
        const { congregation_id } = req.params;
        const groups = await groupRepository_1.groupRepository.find({
            where: {
                congregation: {
                    id: congregation_id
                }
            },
        });
        if (!groups)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.group);
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
                        id: groupOverseersId !== null && groupOverseersId !== void 0 ? groupOverseersId : null,
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
                    id: groupOverseersId !== null && groupOverseersId !== void 0 ? groupOverseersId : null,
                    ...rest
                },
            };
        });
        res.status(200).json(groupWith);
    }
    async addPublishersGroup(req, res) {
        const { group_id } = req.params;
        const { publishers_ids } = req.body;
        const group = await groupRepository_1.groupRepository.findOneBy({ id: group_id });
        if (!group)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.group);
        const publisherPromises = publishers_ids.map(async (publisher_id) => {
            const publisher = await publisherRepository_1.publisherRepository.findOne({
                where: {
                    id: publisher_id
                }
            });
            if (publisher) {
                publisher.group = group;
                return publisherRepository_1.publisherRepository.save(publisher);
            }
            else {
                return null; // Tratar caso o publisher não seja encontrado
            }
        });
        // Aguardar a resolução de todas as promessas
        const updatedPublishers = await Promise.all(publisherPromises);
        res.send();
    }
    async updateGroupOverseer(req, res) {
        const { group_id } = req.params;
        const { publisher_id } = req.body;
        const group = await groupRepository_1.groupRepository.findOneBy({ id: group_id });
        if (!group)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.group);
        const publisher = await publisherRepository_1.publisherRepository.findOneBy({ id: publisher_id });
        if (!publisher)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.publisher);
        const groupOverseerExists = await groupOverseersRepository_1.groupOverseersRepository.findOne({
            where: {
                publisher: {
                    id: publisher_id
                }
            }
        });
        if (groupOverseerExists) {
            group.groupOverseers = groupOverseerExists;
            publisher.groupOverseers = groupOverseerExists;
            await groupRepository_1.groupRepository.save(group);
            await publisherRepository_1.publisherRepository.save(publisher);
            return res.send();
        }
        else {
            const newGroupOverseer = groupOverseersRepository_1.groupOverseersRepository.create({
                publisher
            });
            await groupOverseersRepository_1.groupOverseersRepository.save(newGroupOverseer).then(async (suc) => {
                publisher.groupOverseers = suc;
                group.groupOverseers = suc;
                await groupRepository_1.groupRepository.save(group);
                await publisherRepository_1.publisherRepository.save(publisher);
            });
            return res.send();
        }
    }
    async removePublishersGroup(req, res) {
        const { group_id } = req.params;
        const { publishers_ids } = req.body;
        const group = await groupRepository_1.groupRepository.findOneBy({ id: group_id });
        if (!group)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.group);
        const publisherPromises = publishers_ids.map(async (publisher_id) => {
            const publisher = await publisherRepository_1.publisherRepository.findOne({
                where: {
                    id: publisher_id
                }
            });
            if (publisher) {
                publisher.group = null;
                return publisherRepository_1.publisherRepository.save(publisher);
            }
            else {
                return null; // Tratar caso o publisher não seja encontrado
            }
        });
        // Aguardar a resolução de todas as promessas
        await Promise.all(publisherPromises);
        res.send();
    }
    async delete(req, res) {
        const { group_id } = req.params;
        const group = await groupRepository_1.groupRepository.findOneBy({ id: group_id });
        if (!group) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.group);
        }
        const publishers = await publisherRepository_1.publisherRepository.find({
            where: {
                group: {
                    id: group_id
                }
            }
        });
        for (const publisher of publishers) {
            publisher.group = null;
            // Salve as alterações no banco de dados
            await publisherRepository_1.publisherRepository.save(publisher);
        }
        await groupRepository_1.groupRepository.remove(group);
        return res.status(200).end();
    }
}
exports.default = new GroupController();
