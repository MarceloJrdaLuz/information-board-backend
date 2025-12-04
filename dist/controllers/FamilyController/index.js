"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
const familyRepository_1 = require("../../repositories/familyRepository");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const typeorm_1 = require("typeorm");
class FamilyController {
    // -------------------------------------------------
    // CREATE
    // -------------------------------------------------
    async create(req, res) {
        const { congregation_id } = req.params;
        const { name, responsible_publisher_id, memberIds } = req.body;
        if (!name || name.trim().length === 0) {
            throw new api_errors_1.BadRequestError("Family name is required");
        }
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        // Verifica duplicidade de nome
        const existing = await familyRepository_1.familyRepository.findOne({
            where: { name, congregation: { id: congregation_id } }
        });
        if (existing)
            throw new api_errors_1.BadRequestError("A family with this name already exists");
        // --------------------------------------------
        // VALIDAÇÃO DE MEMBROS USANDO memberIds
        // --------------------------------------------
        let members = [];
        if (Array.isArray(memberIds) && memberIds.length > 0) {
            // Busca todas as famílias da congregação com seus membros
            const families = await familyRepository_1.familyRepository.find({
                where: { congregation: { id: congregation_id } },
                relations: ["members"]
            });
            // Checa se algum publisher já pertence a outra família
            const conflict = families.some(f => f.members.some(p => memberIds.includes(p.id)));
            if (conflict) {
                throw new api_errors_1.BadRequestError("One or more publishers already belong to another family");
            }
            // Busca os membros válidos
            members = await publisherRepository_1.publisherRepository.find({
                where: { id: (0, typeorm_1.In)(memberIds), congregation: { id: congregation_id } }
            });
        }
        // --------------------------------------------
        // RESPONSÁVEL (opcional)
        // --------------------------------------------
        let responsiblePublisher = null;
        if (responsible_publisher_id) {
            responsiblePublisher = await publisherRepository_1.publisherRepository.findOne({
                where: {
                    id: responsible_publisher_id,
                    congregation: { id: congregation_id }
                }
            });
            if (!responsiblePublisher)
                throw new api_errors_1.NotFoundError("Responsible publisher not found");
        }
        const newFamily = familyRepository_1.familyRepository.create({
            name,
            congregation,
            responsible: responsiblePublisher,
            members
        });
        await familyRepository_1.familyRepository.save(newFamily);
        return res.status(201).json(newFamily);
    }
    // -------------------------------------------------
    // UPDATE
    // -------------------------------------------------
    async update(req, res) {
        const { family_id } = req.params;
        const { name, responsible_publisher_id, memberIds } = req.body;
        const family = await familyRepository_1.familyRepository.findOne({
            where: { id: family_id },
            relations: ["members", "congregation"]
        });
        if (!family)
            throw new api_errors_1.NotFoundError("Family not found");
        const congregationId = family.congregation.id;
        // --------------------------------------------
        // Nome da família
        // --------------------------------------------
        if (name) {
            const duplicate = await familyRepository_1.familyRepository.findOne({
                where: {
                    name,
                    congregation: { id: congregationId },
                    id: (0, typeorm_1.Not)(family_id)
                }
            });
            if (duplicate)
                throw new api_errors_1.BadRequestError("Another family already has this name");
            family.name = name;
        }
        // --------------------------------------------
        // Atualizar responsável
        // --------------------------------------------
        if (responsible_publisher_id !== undefined) {
            if (responsible_publisher_id === null) {
                family.responsible = null;
            }
            else {
                const responsiblePublisher = await publisherRepository_1.publisherRepository.findOne({
                    where: { id: responsible_publisher_id, congregation: { id: congregationId } }
                });
                if (!responsiblePublisher)
                    throw new api_errors_1.NotFoundError("Responsible publisher not found");
                family.responsible = responsiblePublisher;
            }
        }
        // --------------------------------------------
        // Atualizar membros
        // --------------------------------------------
        if (Array.isArray(memberIds)) {
            const families = await familyRepository_1.familyRepository.find({
                where: { congregation: { id: congregationId }, id: (0, typeorm_1.Not)(family_id) },
                relations: ["members"]
            });
            const conflict = families.some(f => f.members.some(p => memberIds.includes(p.id)));
            if (conflict) {
                throw new api_errors_1.BadRequestError("One or more publishers already belong to another family");
            }
            const members = memberIds.length
                ? await publisherRepository_1.publisherRepository.find({
                    where: { id: (0, typeorm_1.In)(memberIds), congregation: { id: congregationId } }
                })
                : [];
            family.members = members;
        }
        await familyRepository_1.familyRepository.save(family);
        return res.status(200).json(family);
    }
    // -------------------------------------------------
    // DELETE
    // -------------------------------------------------
    async delete(req, res) {
        const { family_id } = req.params;
        const family = await familyRepository_1.familyRepository.findOne({
            where: { id: family_id }
        });
        if (!family)
            throw new api_errors_1.NotFoundError("Family not found");
        await familyRepository_1.familyRepository.remove(family);
        return res.status(200).end();
    }
    // -------------------------------------------------
    // GET SINGLE FAMILY
    // -------------------------------------------------
    async getFamily(req, res) {
        const { family_id } = req.params;
        const family = await familyRepository_1.familyRepository.findOne({
            where: { id: family_id },
            relations: ["members", "responsible"]
        });
        if (!family)
            throw new api_errors_1.NotFoundError("Family not found");
        return res.status(200).json(family);
    }
    // -------------------------------------------------
    // GET ALL FAMILIES
    // -------------------------------------------------
    async getFamilies(req, res) {
        const { congregation_id } = req.params;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        const families = await familyRepository_1.familyRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["members", "responsible"],
            order: { name: "ASC" }
        });
        return res.status(200).json(families);
    }
}
exports.default = new FamilyController();
