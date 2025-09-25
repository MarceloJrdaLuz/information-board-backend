"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const typeorm_1 = require("typeorm");
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const hospitalityGroupRepository_1 = require("../../repositories/hospitalityGroupRepository");
class HospitalityGroupController {
    async create(req, res) {
        var _a;
        const { congregation_id } = req.params;
        const { name, publisherHost_id, next_reception, member_ids } = req.body;
        const nextReceptionDate = (0, moment_timezone_1.default)(next_reception).format("YYYY-MM-DD");
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        let host = null;
        if (publisherHost_id) {
            host = await publisherRepository_1.publisherRepository.findOneBy({ id: publisherHost_id, congregation: { id: congregation.id } });
            if (!host)
                throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.publisher);
        }
        let members = [];
        if (member_ids && member_ids.length > 0) {
            members = await publisherRepository_1.publisherRepository.findBy({
                id: (0, typeorm_1.In)(member_ids)
            });
            if (members.length !== member_ids.length) {
                throw new api_errors_1.BadRequestError("Some members were not found");
            }
        }
        try {
            // Buscar todos os grupos da congregação para calcular posição
            const groups = await hospitalityGroupRepository_1.hospitalityGroupRepository.find({
                where: { congregation: { id: congregation.id } },
                order: { position: "ASC" }
            });
            const position = groups.length > 0
                ? ((_a = groups[groups.length - 1].position) !== null && _a !== void 0 ? _a : 0) + 1
                : 1;
            const newGroup = hospitalityGroupRepository_1.hospitalityGroupRepository.create({
                name,
                congregation,
                host,
                next_reception: nextReceptionDate || null,
                position,
                members,
            });
            await hospitalityGroupRepository_1.hospitalityGroupRepository.save(newGroup);
            return res.status(201).json(newGroup);
        }
        catch (error) {
            if (error.code === "23505") { // Postgres unique violation
                throw new api_errors_1.BadRequestError("A group with this name already exists in this congregation");
            }
            throw error; // repassa para middleware global
        }
    }
    async update(req, res) {
        var _a;
        const { hospitalityGroup_id } = req.params;
        const { publisherHost_id, next_reception, member_ids, name } = req.body;
        const nextReceptionDate = (0, moment_timezone_1.default)(next_reception).format("YYYY-MM-DD");
        const group = await hospitalityGroupRepository_1.hospitalityGroupRepository.findOne({
            where: { id: hospitalityGroup_id },
            relations: ["congregation", "host", "members"],
        });
        if (!group)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.groupHospitality);
        if (publisherHost_id !== undefined) {
            if (publisherHost_id === null) {
                group.host = null;
            }
            else {
                const host = await publisherRepository_1.publisherRepository.findOneBy({ id: publisherHost_id });
                if (!host)
                    throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.publisher);
                group.host = host;
            }
        }
        if (name !== undefined) {
            group.name = name;
        }
        if (next_reception !== undefined) {
            group.next_reception = nextReceptionDate;
        }
        if (member_ids !== undefined) {
            // Determinar qual será o host final (novo ou já existente)
            const currentHostId = publisherHost_id !== undefined
                ? publisherHost_id // novo host enviado no body (pode ser null também)
                : (_a = group.host) === null || _a === void 0 ? void 0 : _a.id; // host já definido no grupo
            // Se tiver host, remover ele da lista de membros
            const filteredMemberIds = currentHostId
                ? member_ids.filter(id => id !== currentHostId)
                : member_ids;
            if (filteredMemberIds.length === 0) {
                group.members = [];
            }
            else {
                const members = await publisherRepository_1.publisherRepository.findBy({
                    id: (0, typeorm_1.In)(filteredMemberIds)
                });
                if (members.length !== filteredMemberIds.length) {
                    throw new api_errors_1.BadRequestError("Some members were not found");
                }
                group.members = members;
            }
        }
        try {
            await hospitalityGroupRepository_1.hospitalityGroupRepository.save(group);
            return res.json(group);
        }
        catch (error) {
            if (error.code === "23505") { // Postgres unique violation
                throw new api_errors_1.BadRequestError("A group with this name already exists in this congregation");
            }
            throw error;
        }
    }
    async delete(req, res) {
        const { hospitalityGroup_id } = req.params;
        const group = await hospitalityGroupRepository_1.hospitalityGroupRepository.findOneBy({ id: hospitalityGroup_id });
        if (!group)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.groupHospitality);
        await hospitalityGroupRepository_1.hospitalityGroupRepository.remove(group);
        return res.status(200).end();
    }
    async getHospitalityGroups(req, res) {
        const { congregation_id } = req.params;
        const groups = await hospitalityGroupRepository_1.hospitalityGroupRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["host", "members"],
            order: { position: "ASC" },
        });
        return res.json(groups);
    }
    async getHospitalityGroup(req, res) {
        const { hospitalityGroup_id } = req.params;
        const group = await hospitalityGroupRepository_1.hospitalityGroupRepository.findOne({
            where: { id: hospitalityGroup_id },
            relations: ["host", "members"],
        });
        if (!group)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.groupHospitality);
        return res.json(group);
    }
    async reorderGroups(req, res) {
        const { congregation_id } = req.params;
        const { orderedGroupIds } = req.body;
        if (!orderedGroupIds || orderedGroupIds.length === 0) {
            throw new api_errors_1.BadRequestError("The list of groups cannot be empty");
        }
        // Buscar todos os grupos da congregação
        const groups = await hospitalityGroupRepository_1.hospitalityGroupRepository.find({
            where: { congregation: { id: congregation_id } },
        });
        if (groups.length !== orderedGroupIds.length) {
            throw new api_errors_1.BadRequestError("Group list length does not match congregation group count");
        }
        // Mapear grupos por id para fácil acesso
        const groupMap = new Map(groups.map(g => [g.id, g]));
        const updatedGroups = [];
        // Atualiza a posição de cada grupo de acordo com a ordem recebida
        orderedGroupIds.forEach((id, index) => {
            const group = groupMap.get(id);
            if (!group) {
                throw new api_errors_1.NotFoundError(`GroupHospitality ${id} not found in this congregation`);
            }
            group.position = index + 1; // posição começa em 1
            updatedGroups.push(group);
        });
        // Salva todas as alterações em uma única operação
        await hospitalityGroupRepository_1.hospitalityGroupRepository.save(updatedGroups);
        return res.end();
    }
}
exports.default = new HospitalityGroupController();
