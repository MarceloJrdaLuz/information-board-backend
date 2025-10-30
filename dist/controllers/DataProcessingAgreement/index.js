"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const DataProcessingAgreement_1 = require("../../entities/DataProcessingAgreement");
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const dataProcessingAgreementRepository_1 = require("../../repositories/dataProcessingAgreementRepository");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const termsOfUseRepository_1 = require("../../repositories/termsOfUseRepository");
const userRepository_1 = require("../../repositories/userRepository");
class DataProcessingAgreementController {
    async accept(req, res) {
        const { type, publisher_id, congregation_id, deviceId, accepted_by_user_id } = req.body;
        if (!type)
            throw new api_errors_1.BadRequestError("Type is requeired");
        // buscar termo ativo
        const term = await termsOfUseRepository_1.termsRepository.findOne({
            where: { type, is_active: true },
        });
        if (!term)
            throw new api_errors_1.NotFoundError("Terms active not found");
        const existingAgreement = await dataProcessingAgreementRepository_1.agreementRepository.findOne({
            where: {
                type,
                version: term.version,
                ...(publisher_id ? { publisher: { id: publisher_id } } : {}),
                ...(congregation_id ? { congregation: { id: congregation_id } } : {}),
                deviceId: deviceId !== null && deviceId !== void 0 ? deviceId : "",
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
        const agreement = new DataProcessingAgreement_1.DataProcessingAgreement();
        agreement.type = type;
        agreement.version = term.version;
        agreement.content_snapshot = term.content;
        agreement.content_hash = crypto_1.default
            .createHash("sha256")
            .update(term.content)
            .digest("hex");
        agreement.accepted_at = (0, moment_timezone_1.default)().toDate();
        agreement.deviceId = deviceId || null;
        agreement.terms = term;
        if (publisher_id) {
            const publisher = await publisherRepository_1.publisherRepository.findOneBy({ id: publisher_id });
            if (!publisher)
                throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.publisher);
            agreement.publisher = publisher;
        }
        if (congregation_id) {
            const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
            if (!congregation)
                throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
            agreement.congregation = congregation;
            if (accepted_by_user_id) {
                const acceptedBy = await userRepository_1.userRepository.findOne({
                    where: { id: accepted_by_user_id },
                    relations: ["congregation"], // garantir que traga a congregação
                });
                if (!acceptedBy)
                    throw new api_errors_1.NotFoundError("User who accepted not found");
                //  Verificar se pertence à congregação
                if (acceptedBy.congregation.id !== congregation_id) {
                    throw new api_errors_1.BadRequestError("User does not belong to this congregation");
                }
                agreement.accepted_by_user = acceptedBy;
            }
            else {
                throw new api_errors_1.BadRequestError("accepted_by_user_id is required when accepting for a congregation");
            }
        }
        const saved = await dataProcessingAgreementRepository_1.agreementRepository.save(agreement);
        return res.status(201).json({
            id: saved.id,
            type: saved.type,
            version: saved.version,
            content_hash: saved.content_hash,
            accepted_at: saved.accepted_at,
        });
    }
    // Listar todos os consentimentos
    async list(req, res) {
        const agreements = await dataProcessingAgreementRepository_1.agreementRepository.find({
            order: { accepted_at: "DESC" },
            relations: ["publisher", "congregation"],
        });
        return res.json(agreements);
    }
    // Buscar consentimento por usuário
    async getByPublisher(req, res) {
        const { publisher_id } = req.params;
        const publisher = await publisherRepository_1.publisherRepository.findOneBy({ id: publisher_id });
        if (!publisher)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.publisher);
        const agreements = await dataProcessingAgreementRepository_1.agreementRepository.find({
            where: {
                publisher: {
                    id: publisher_id
                }
            },
            order: { accepted_at: "DESC" },
            relations: ["terms"],
        });
        return res.json(agreements);
    }
    // Buscar consentimento por congregação
    async getByCongregation(req, res) {
        const { congregation_id } = req.params;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        const agreements = await dataProcessingAgreementRepository_1.agreementRepository.find({
            where: {
                congregation: {
                    id: congregation_id
                }
            },
            order: { accepted_at: "DESC" },
            relations: ["terms"],
        });
        return res.json(agreements);
    }
    async check(req, res) {
        const { publisher_id, congregation_id, type } = req.query;
        if (!type)
            throw new api_errors_1.BadRequestError("Type is required");
        // Buscar termo ativo
        const activeTerm = await termsOfUseRepository_1.termsRepository.findOne({
            where: { type: type, is_active: true },
        });
        if (!activeTerm)
            throw new api_errors_1.NotFoundError("Active term not found");
        // Buscar último consentimento
        const lastAgreement = await dataProcessingAgreementRepository_1.agreementRepository.findOne({
            where: {
                type: type,
                ...(publisher_id ? { publisher: { id: publisher_id } } : {}),
                ...(congregation_id ? { congregation: { id: congregation_id } } : {}),
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
exports.default = new DataProcessingAgreementController();
