"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const cleaningGroupRepository_1 = require("../../repositories/cleaningGroupRepository");
const typeorm_1 = require("typeorm");
const cleaningScheduleRepository_1 = require("../../repositories/cleaningScheduleRepository");
class CleaningGroupController {
    async create(req, res) {
        const { congregation_id } = req.params;
        const { name, publisherIds, order } = req.body;
        if (!order || order <= 0)
            throw new api_errors_1.BadRequestError("Order must be a positive integer");
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation)
            throw new api_errors_1.BadRequestError(messageErrors_1.messageErrors.notFound.congregation);
        const existingGroups = await cleaningGroupRepository_1.cleaningGroupRepository.find({
            where: { congregation: { id: congregation.id } },
            order: { order: "ASC" }
        });
        if (existingGroups.some(g => g.name === name)) {
            throw new api_errors_1.BadRequestError("Cleaning group already exists in this congregation");
        }
        // Valida conflito de ordem
        if (existingGroups.some(g => g.order === order)) {
            throw new api_errors_1.BadRequestError("Another group already has this order");
        }
        await cleaningGroupRepository_1.cleaningGroupRepository.save(existingGroups);
        let publishers = [];
        if (publisherIds === null || publisherIds === void 0 ? void 0 : publisherIds.length) {
            // Busca todos os grupos da congregação com seus publishers
            const allGroups = await cleaningGroupRepository_1.cleaningGroupRepository.find({
                where: { congregation: { id: congregation.id } },
                relations: ["publishers"]
            });
            // Checa se algum dos publishers já está em outro grupo
            const conflict = allGroups.some(group => group.publishers.some(p => publisherIds.includes(p.id)));
            if (conflict) {
                throw new api_errors_1.BadRequestError("One or more publishers are already assigned to another group");
            }
            // Se não tem conflito, busca os publishers de fato
            publishers = await publisherRepository_1.publisherRepository.find({
                where: { id: (0, typeorm_1.In)(publisherIds), congregation: { id: congregation.id } }
            });
        }
        const newGroup = cleaningGroupRepository_1.cleaningGroupRepository.create({
            name,
            order,
            congregation,
            publishers
        });
        await cleaningGroupRepository_1.cleaningGroupRepository.save(newGroup);
        return res.status(201).json(newGroup);
    }
    async update(req, res) {
        var _a;
        const { group_id: id } = req.params;
        const { name, publisherIds } = req.body;
        const group = await cleaningGroupRepository_1.cleaningGroupRepository.findOne({
            where: { id },
            relations: ["publishers", "congregation"]
        });
        if (!group) {
            throw new api_errors_1.NotFoundError("Cleaning group not found");
        }
        if (Array.isArray(publisherIds)) {
            const congregationId = (_a = group.congregation) === null || _a === void 0 ? void 0 : _a.id;
            if (!congregationId)
                throw new api_errors_1.BadRequestError(messageErrors_1.messageErrors.notFound.congregation);
            // Busca todos os grupos da congregação com seus publishers, exceto o grupo que está sendo editado
            const allGroups = await cleaningGroupRepository_1.cleaningGroupRepository.find({
                where: { congregation: { id: congregationId }, id: (0, typeorm_1.Not)(id) },
                relations: ["publishers"]
            });
            const conflict = allGroups.some(g => g.publishers.some(p => publisherIds.includes(p.id)));
            if (conflict) {
                throw new api_errors_1.BadRequestError("One or more publishers are already assigned to another group");
            }
            // Busca os publishers válidos
            const publishers = publisherIds.length
                ? await publisherRepository_1.publisherRepository.find({
                    where: { id: (0, typeorm_1.In)(publisherIds), congregation: { id: congregationId } }
                })
                : [];
            group.publishers = publishers;
        }
        if (name)
            group.name = name;
        await cleaningGroupRepository_1.cleaningGroupRepository.save(group);
        return res.status(200).json(group);
    }
    async delete(req, res) {
        const { group_id } = req.params;
        const group = await cleaningGroupRepository_1.cleaningGroupRepository.findOne({
            where: { id: group_id },
            relations: ["congregation"]
        });
        if (!group)
            throw new api_errors_1.NotFoundError("Cleaning group not found");
        // 🔹 Remove todos os schedules relacionados ao grupo
        const schedules = await cleaningScheduleRepository_1.cleaningScheduleRepository.find({
            where: { group: { id: group_id } }
        });
        if (schedules.length > 0) {
            await cleaningScheduleRepository_1.cleaningScheduleRepository.remove(schedules);
        }
        // 🔹 Agora sim pode remover o grupo
        await cleaningGroupRepository_1.cleaningGroupRepository.remove(group);
        // 🔄 Reorganiza ordens após remover
        const groups = await cleaningGroupRepository_1.cleaningGroupRepository.find({
            where: { congregation: { id: group.congregation.id } },
            order: { order: "ASC" }
        });
        groups.forEach((g, index) => {
            g.order = index + 1;
        });
        await cleaningGroupRepository_1.cleaningGroupRepository.save(groups);
        return res.status(200).end();
    }
    async getGroup(req, res) {
        const { group_id: id } = req.params;
        const group = await cleaningGroupRepository_1.cleaningGroupRepository.findOne({
            where: { id },
            relations: ["publishers"]
        });
        if (!group)
            throw new api_errors_1.NotFoundError("Cleaning group not found");
        return res.status(200).json(group);
    }
    async getGroups(req, res) {
        const { congregation_id } = req.params;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        const groups = await cleaningGroupRepository_1.cleaningGroupRepository.find({
            where: { congregation: { id: congregation.id } },
            relations: ["publishers"],
            order: { order: "ASC" }
        });
        return res.status(200).json(groups);
    }
}
exports.default = new CleaningGroupController();
