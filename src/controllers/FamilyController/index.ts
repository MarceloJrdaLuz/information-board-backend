import { Response } from "express";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { messageErrors } from "../../helpers/messageErrors";
import { familyRepository } from "../../repositories/familyRepository";
import { publisherRepository } from "../../repositories/publisherRepository";
import { congregationRepository } from "../../repositories/congregationRepository";

import {
    ParamsFamilyCreate,
    BodyFamilyCreate,
    ParamsFamilyUpdate,
    BodyFamilyUpdate,
    ParamsGetFamily,
    ParamsGetFamilies,
    ParamsDeleteFamily
} from "./types";

import { CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest";
import { In, Not } from "typeorm";
import { Publisher } from "../../entities/Publisher";

class FamilyController {

    // -------------------------------------------------
    // CREATE
    // -------------------------------------------------
    async create(
        req: CustomRequestPT<ParamsFamilyCreate, BodyFamilyCreate>,
        res: Response
    ) {
        const { congregation_id } = req.params;
        const { name, responsible_publisher_id, memberIds } = req.body;

        if (!name || name.trim().length === 0) {
            throw new BadRequestError("Family name is required");
        }

        const congregation = await congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation)
            throw new NotFoundError(messageErrors.notFound.congregation);

        // Verifica duplicidade de nome
        const existing = await familyRepository.findOne({
            where: { name, congregation: { id: congregation_id } }
        });

        if (existing) throw new BadRequestError("A family with this name already exists");

        // --------------------------------------------
        // VALIDAÇÃO DE MEMBROS USANDO memberIds
        // --------------------------------------------
        let members: Publisher[] = [];
        if (Array.isArray(memberIds) && memberIds.length > 0) {

            // Busca todas as famílias da congregação com seus membros
            const families = await familyRepository.find({
                where: { congregation: { id: congregation_id } },
                relations: ["members"]
            });

            // Checa se algum publisher já pertence a outra família
            const conflict = families.some(f =>
                f.members.some(p => memberIds.includes(p.id))
            );

            if (conflict) {
                throw new BadRequestError("One or more publishers already belong to another family");
            }

            // Busca os membros válidos
            members = await publisherRepository.find({
                where: { id: In(memberIds), congregation: { id: congregation_id } }
            });
        }

        // --------------------------------------------
        // RESPONSÁVEL (opcional)
        // --------------------------------------------
        let responsiblePublisher: Publisher | null = null;

        if (responsible_publisher_id) {
            responsiblePublisher = await publisherRepository.findOne({
                where: {
                    id: responsible_publisher_id,
                    congregation: { id: congregation_id }
                }
            });

            if (!responsiblePublisher)
                throw new NotFoundError("Responsible publisher not found");
        }

        const newFamily = familyRepository.create({
            name,
            congregation,
            responsible: responsiblePublisher,
            members
        });

        await familyRepository.save(newFamily);

        return res.status(201).json(newFamily);
    }

    // -------------------------------------------------
    // UPDATE
    // -------------------------------------------------
    async update(
        req: CustomRequestPT<ParamsFamilyUpdate, BodyFamilyUpdate>,
        res: Response
    ) {
        const { family_id } = req.params;
        const { name, responsible_publisher_id, memberIds } = req.body;

        const family = await familyRepository.findOne({
            where: { id: family_id },
            relations: ["members", "congregation"]
        });

        if (!family) throw new NotFoundError("Family not found");

        const congregationId = family.congregation.id;

        // --------------------------------------------
        // Nome da família
        // --------------------------------------------
        if (name) {
            const duplicate = await familyRepository.findOne({
                where: {
                    name,
                    congregation: { id: congregationId },
                    id: Not(family_id)
                }
            });

            if (duplicate)
                throw new BadRequestError("Another family already has this name");

            family.name = name;
        }

        // --------------------------------------------
        // Atualizar responsável
        // --------------------------------------------
        if (responsible_publisher_id !== undefined) {
            if (responsible_publisher_id === null) {
                family.responsible = null;
            } else {
                const responsiblePublisher = await publisherRepository.findOne({
                    where: { id: responsible_publisher_id, congregation: { id: congregationId } }
                });

                if (!responsiblePublisher)
                    throw new NotFoundError("Responsible publisher not found");

                family.responsible = responsiblePublisher;
            }
        }

        // --------------------------------------------
        // Atualizar membros
        // --------------------------------------------
        if (Array.isArray(memberIds)) {
            const families = await familyRepository.find({
                where: { congregation: { id: congregationId }, id: Not(family_id) },
                relations: ["members"]
            });

            const conflict = families.some(f =>
                f.members.some(p => memberIds.includes(p.id))
            );

            if (conflict) {
                throw new BadRequestError("One or more publishers already belong to another family");
            }

            const members = memberIds.length
                ? await publisherRepository.find({
                    where: { id: In(memberIds), congregation: { id: congregationId } }
                })
                : [];

            family.members = members;
        }

        await familyRepository.save(family);

        return res.status(200).json(family);
    }

    // -------------------------------------------------
    // DELETE
    // -------------------------------------------------
    async delete(
        req: ParamsCustomRequest<ParamsDeleteFamily>,
        res: Response
    ) {
        const { family_id } = req.params;

        const family = await familyRepository.findOne({
            where: { id: family_id }
        });

        if (!family) throw new NotFoundError("Family not found");

        await familyRepository.remove(family);

        return res.status(200).end();
    }

    // -------------------------------------------------
    // GET SINGLE FAMILY
    // -------------------------------------------------
    async getFamily(
        req: ParamsCustomRequest<ParamsGetFamily>,
        res: Response
    ) {
        const { family_id } = req.params;

        const family = await familyRepository.findOne({
            where: { id: family_id },
            relations: ["members", "responsible"]
        });

        if (!family) throw new NotFoundError("Family not found");

        return res.status(200).json(family);
    }

    // -------------------------------------------------
    // GET ALL FAMILIES
    // -------------------------------------------------
    async getFamilies(
        req: ParamsCustomRequest<ParamsGetFamilies>,
        res: Response
    ) {
        const { congregation_id } = req.params;

        const congregation = await congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation)
            throw new NotFoundError(messageErrors.notFound.congregation);

        const families = await familyRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["members", "responsible"],
            order: { name: "ASC" }
        });

        return res.status(200).json(families);
    }
}

export default new FamilyController();
