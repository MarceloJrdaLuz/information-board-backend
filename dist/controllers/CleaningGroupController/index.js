"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const cleaningGroupRepository_1 = require("../../repositories/cleaningGroupRepository");
const typeorm_1 = require("typeorm");
const cleaningScheduleRepository_1 = require("../../repositories/cleaningScheduleRepository");
const publisherPrivilegeHelper_1 = require("../../helpers/publisherPrivilegeHelper");
const privileges_1 = require("../../types/privileges");
class CleaningGroupController {
    async create(req, res) {
        const { congregation_id } = req.params;
        let { name, publisherIds, order, dayPreference } = req.body;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation)
            throw new api_errors_1.BadRequestError(messageErrors_1.messageErrors.notFound.congregation);
        const existingGroups = await cleaningGroupRepository_1.cleaningGroupRepository.find({
            where: { congregation: { id: congregation.id } },
            order: { order: "ASC" }
        });
        // Se a ordem não foi fornecida, assume automaticamente o próximo número na sequência
        const finalOrder = (order && order > 0) ? order : (existingGroups.length + 1);
        // Valida conflito de ordem se o usuário tiver especificado explicitamente
        if (order && order > 0 && existingGroups.some(g => g.order === finalOrder)) {
            throw new api_errors_1.BadRequestError("Another group already has this order");
        }
        const trimmedName = name === null || name === void 0 ? void 0 : name.trim();
        // Se o nome não foi informado ou está em branco, assume o padrão "Grupo {order}"
        const finalName = trimmedName || `Grupo ${finalOrder}`;
        // Só valida duplicidade se for um nome personalizado diferente de "Grupo X"
        const isCustomName = trimmedName && !/^grupo\s*\d+$/i.test(trimmedName);
        if (isCustomName && existingGroups.some(g => { var _a; return ((_a = g.name) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) === trimmedName.toLowerCase(); })) {
            throw new api_errors_1.BadRequestError("Cleaning group already exists in this congregation");
        }
        let publishers = [];
        if (publisherIds && publisherIds.length > 0) {
            const pIds = publisherIds;
            // Busca todos os grupos da congregação com seus publishers
            const allGroups = await cleaningGroupRepository_1.cleaningGroupRepository.find({
                where: { congregation: { id: congregation.id } },
                relations: ["publishers"]
            });
            // Checa se algum dos publishers já está em outro grupo
            const conflict = allGroups.some(group => group.publishers.some(p => pIds.includes(p.id)));
            if (conflict) {
                throw new api_errors_1.BadRequestError("One or more publishers are already assigned to another group");
            }
            // Se não tem conflito, busca os publishers de fato
            const rawPublishers = await publisherRepository_1.publisherRepository.find({
                where: { id: (0, typeorm_1.In)(pIds), congregation: { id: congregation.id } },
                relations: ["privilegesRelation", "privilegesRelation.privilege"]
            });
            publishers = rawPublishers.filter(p => (0, publisherPrivilegeHelper_1.hasPrivilege)(p, privileges_1.PrivilegeCode.PUBLISHER));
        }
        const newGroup = cleaningGroupRepository_1.cleaningGroupRepository.create({
            name: finalName,
            order: finalOrder,
            dayPreference: dayPreference || "ALL",
            congregation,
            publishers
        });
        await cleaningGroupRepository_1.cleaningGroupRepository.save(newGroup);
        return res.status(201).json(newGroup);
    }
    async update(req, res) {
        var _a;
        const { group_id: id } = req.params;
        const { name, publisherIds, dayPreference } = req.body;
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
            const rawPublishers = publisherIds.length
                ? await publisherRepository_1.publisherRepository.find({
                    where: { id: (0, typeorm_1.In)(publisherIds), congregation: { id: congregationId } },
                    relations: ["privilegesRelation", "privilegesRelation.privilege"]
                })
                : [];
            group.publishers = rawPublishers.filter(p => (0, publisherPrivilegeHelper_1.hasPrivilege)(p, privileges_1.PrivilegeCode.PUBLISHER));
        }
        if (name !== undefined) {
            const trimmed = name === null || name === void 0 ? void 0 : name.trim();
            // Se enviado vazio ou em branco, restaura para o padrão "Grupo {order}"
            group.name = trimmed || `Grupo ${group.order}`;
        }
        if (dayPreference)
            group.dayPreference = dayPreference;
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
        // 🔄 Reorganiza ordens e nomes padrão após remover
        const groups = await cleaningGroupRepository_1.cleaningGroupRepository.find({
            where: { congregation: { id: group.congregation.id } },
            order: { order: "ASC" }
        });
        groups.forEach((g, index) => {
            const newOrder = index + 1;
            // Se o grupo usa o nome padrão "Grupo X" ou está sem nome, sincroniza o nome com a nova ordem!
            const isDefaultName = !g.name || /^grupo\s*\d+$/i.test(g.name.trim());
            if (isDefaultName) {
                g.name = `Grupo ${newOrder}`;
            }
            g.order = newOrder;
        });
        await cleaningGroupRepository_1.cleaningGroupRepository.save(groups);
        return res.status(200).end();
    }
    async getGroup(req, res) {
        const { group_id: id } = req.params;
        const group = await cleaningGroupRepository_1.cleaningGroupRepository.findOne({
            where: { id },
            relations: ["publishers", "publishers.privilegesRelation", "publishers.privilegesRelation.privilege"]
        });
        if (!group)
            throw new api_errors_1.NotFoundError("Cleaning group not found");
        if (group.publishers) {
            group.publishers = group.publishers.filter(p => (0, publisherPrivilegeHelper_1.hasPrivilege)(p, privileges_1.PrivilegeCode.PUBLISHER));
        }
        return res.status(200).json(group);
    }
    async getGroups(req, res) {
        const { congregation_id } = req.params;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        const groups = await cleaningGroupRepository_1.cleaningGroupRepository.find({
            where: { congregation: { id: congregation.id } },
            relations: ["publishers", "publishers.privilegesRelation", "publishers.privilegesRelation.privilege"],
            order: { order: "ASC" }
        });
        for (const g of groups) {
            if (g.publishers) {
                g.publishers = g.publishers.filter(p => (0, publisherPrivilegeHelper_1.hasPrivilege)(p, privileges_1.PrivilegeCode.PUBLISHER));
            }
        }
        return res.status(200).json(groups);
    }
    async reorderGroups(req, res) {
        const { congregation_id } = req.params;
        const { orderedGroupIds } = req.body;
        if (!orderedGroupIds || !Array.isArray(orderedGroupIds) || orderedGroupIds.length === 0) {
            throw new api_errors_1.BadRequestError("A lista de grupos não pode estar vazia");
        }
        const groups = await cleaningGroupRepository_1.cleaningGroupRepository.find({
            where: { congregation: { id: congregation_id } },
        });
        if (groups.length !== orderedGroupIds.length) {
            throw new api_errors_1.BadRequestError("A quantidade de grupos enviada não corresponde aos grupos existentes");
        }
        const groupMap = new Map(groups.map(g => [g.id, g]));
        const updatedGroups = [];
        orderedGroupIds.forEach((id, index) => {
            const group = groupMap.get(id);
            if (!group)
                throw new api_errors_1.NotFoundError(`Grupo ${id} não encontrado`);
            const newOrder = index + 1;
            const isDefaultName = !group.name || /^grupo\s*\d+$/i.test(group.name.trim());
            group.order = newOrder;
            if (isDefaultName) {
                group.name = `Grupo ${newOrder}`;
            }
            updatedGroups.push(group);
        });
        await cleaningGroupRepository_1.cleaningGroupRepository.save(updatedGroups);
        return res.status(200).json(updatedGroups);
    }
}
exports.default = new CleaningGroupController();
