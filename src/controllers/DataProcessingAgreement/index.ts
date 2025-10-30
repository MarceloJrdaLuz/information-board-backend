import crypto from "crypto"
import { Request, Response } from "express"
import moment from "moment-timezone"
import { DataProcessingAgreement } from "../../entities/DataProcessingAgreement"
import { BadRequestError, NotFoundError } from "../../helpers/api-errors"
import { messageErrors } from "../../helpers/messageErrors"
import { congregationRepository } from "../../repositories/congregationRepository"
import { agreementRepository } from "../../repositories/dataProcessingAgreementRepository"
import { publisherRepository } from "../../repositories/publisherRepository"
import { termsRepository } from "../../repositories/termsOfUseRepository"
import { CustomRequest } from "../../types/customRequest"
import { BodyAcceptDataProcessingAgreement } from "./types"
import { userRepository } from "../../repositories/userRepository"

class DataProcessingAgreementController {
    async accept(req: CustomRequest<BodyAcceptDataProcessingAgreement>, res: Response) {
        const { type, publisher_id, congregation_id, deviceId, accepted_by_user_id } = req.body

        if (!type) throw new BadRequestError("Type is requeired")

        // buscar termo ativo
        const term = await termsRepository.findOne({
            where: { type, is_active: true },
        })
        if (!term) throw new NotFoundError("Terms active not found")

        const existingAgreement = await agreementRepository.findOne({
            where: {
                type,
                version: term.version,
                ...(publisher_id ? { publisher: { id: publisher_id } } : {}),
                ...(congregation_id ? { congregation: { id: congregation_id } } : {}),
                deviceId: deviceId ?? "",
            },
            relations: ["publisher", "congregation"],
        });

        if (existingAgreement) {
            return res.status(200).json({
                message: "Term already accepted",
                agreement: {
                    id: existingAgreement.id,
                    type: existingAgreement.type,
                    version: existingAgreement.version,
                    content_hash: existingAgreement.content_hash,
                    accepted_at: existingAgreement.accepted_at,
                },
            });
        }

        const agreement = new DataProcessingAgreement()
        agreement.type = type
        agreement.version = term.version
        agreement.content_snapshot = term.content
        agreement.content_hash = crypto
            .createHash("sha256")
            .update(term.content)
            .digest("hex");
        agreement.accepted_at = moment().toDate()
        agreement.deviceId = deviceId || null
        agreement.terms = term

        if (publisher_id) {
            const publisher = await publisherRepository.findOneBy({ id: publisher_id })
            if (!publisher) throw new NotFoundError(messageErrors.notFound.publisher)
            agreement.publisher = publisher
        }

        if (congregation_id) {
            const congregation = await congregationRepository.findOneBy({ id: congregation_id })
            if (!congregation) throw new NotFoundError(messageErrors.notFound.congregation)
            agreement.congregation = congregation
            if (accepted_by_user_id) {
                const acceptedBy = await userRepository.findOne({
                    where: { id: accepted_by_user_id },
                    relations: ["congregation"], // garantir que traga a congregação
                })
                if (!acceptedBy) throw new NotFoundError("User who accepted not found")

                //  Verificar se pertence à congregação
                if (acceptedBy.congregation.id !== congregation_id) {
                    throw new BadRequestError("User does not belong to this congregation")
                }

                agreement.accepted_by_user = acceptedBy
            } else {
                throw new BadRequestError(
                    "accepted_by_user_id is required when accepting for a congregation"
                )
            }
        }


        const saved = await agreementRepository.save(agreement)

        return res.status(201).json({
            id: saved.id,
            type: saved.type,
            version: saved.version,
            content_hash: saved.content_hash,
            accepted_at: saved.accepted_at,
        })
    }

    // Listar todos os consentimentos
    async list(req: Request, res: Response) {
        const agreements = await agreementRepository.find({
            order: { accepted_at: "DESC" },
            relations: ["publisher", "congregation"],
        })
        return res.json(agreements)
    }

    // Buscar consentimento por usuário
    async getByPublisher(req: Request, res: Response) {
        const { publisher_id } = req.params
        const publisher = await publisherRepository.findOneBy({ id: publisher_id })
        if (!publisher) throw new NotFoundError(messageErrors.notFound.publisher)
        const agreements = await agreementRepository.find({
            where:
            {
                publisher: {
                    id: publisher_id
                }
            },
            order: { accepted_at: "DESC" },
            relations: ["terms"],
        })
        return res.json(agreements)
    }

    // Buscar consentimento por congregação
    async getByCongregation(req: Request, res: Response) {
        const { congregation_id } = req.params
        const congregation = await congregationRepository.findOneBy({ id: congregation_id })
        if (!congregation) throw new NotFoundError(messageErrors.notFound.congregation)
        const agreements = await agreementRepository.find({
            where:
            {
                congregation: {
                    id: congregation_id
                }
            },
            order: { accepted_at: "DESC" },
            relations: ["terms"],
        })
        return res.json(agreements)
    }

    async check(req: Request, res: Response) {
        const { publisher_id, congregation_id, type } = req.query;

        if (!type) throw new BadRequestError("Type is required");

        // Buscar termo ativo
        const activeTerm = await termsRepository.findOne({
            where: { type: type as "congregation" | "publisher", is_active: true },
        });
        if (!activeTerm) throw new NotFoundError("Active term not found");

        // Buscar último consentimento
        const lastAgreement = await agreementRepository.findOne({
            where: {
                type: type as "congregation" | "publisher",
                ...(publisher_id ? { publisher: { id: publisher_id as string } } : {}),
                ...(congregation_id ? { congregation: { id: congregation_id as string } } : {}),
            },
            order: { accepted_at: "DESC" },
            relations: ["publisher", "congregation"],
        });

        // Caso não tenha aceitado ainda
        if (!lastAgreement) {
            return res.status(200).json({
                hasAccepted: false,
                isLatestVersion: false,
                acceptedVersion: null,
                currentVersion: activeTerm.version,
                activeTerm: {
                    id: activeTerm.id,
                    type: activeTerm.type,
                    version: activeTerm.version,
                    title: activeTerm.title,
                    content: activeTerm.content,
                },
                message: "No consent found for this entity. Acceptance required.",
            });
        }

        // Comparar versões
        const isLatest = lastAgreement.version === activeTerm.version;

        return res.status(200).json({
            hasAccepted: true,
            isLatestVersion: isLatest,
            acceptedVersion: lastAgreement.version,
            currentVersion: activeTerm.version,
            acceptedAt: lastAgreement.accepted_at,
            activeTerm: {
                id: activeTerm.id,
                type: activeTerm.type,
                version: activeTerm.version,
                title: activeTerm.title,
                content: activeTerm.content,
            },
            message: isLatest
                ? "Consent is up-to-date."
                : "A new version of the data processing agreement requires acceptance.",
        });
    }

}

export default new DataProcessingAgreementController()
