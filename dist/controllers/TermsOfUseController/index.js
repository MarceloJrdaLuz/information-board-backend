"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
const termsOfUseRepository_1 = require("../../repositories/termsOfUseRepository");
class TermsOfUseController {
    async create(req, res) {
        const { title, type, content, version, is_active } = req.body;
        if (!title || !type || !content || !version) {
            throw new api_errors_1.BadRequestError("All fields are required: title, type, content, version");
        }
        const existingTerm = await termsOfUseRepository_1.termsRepository.findOne({
            where: { type, content, version },
        });
        if (existingTerm) {
            throw new api_errors_1.BadRequestError(`A term with the same content already exists for type "${type}"`);
        }
        // se is_active = true, desativa outros termos do mesmo tipo
        if (is_active) {
            await termsOfUseRepository_1.termsRepository.update({ type }, { is_active: false });
        }
        const term = termsOfUseRepository_1.termsRepository.create({
            title,
            type,
            content,
            version,
            is_active: !!is_active,
        });
        const savedTerm = await termsOfUseRepository_1.termsRepository.save(term);
        return res.status(201).json(savedTerm);
    }
    async list(req, res) {
        const { type } = req.query;
        const terms = await termsOfUseRepository_1.termsRepository.find({
            where: { type: type },
            order: { created_at: "DESC" },
        });
        return res.json(terms);
    }
    async getActive(req, res) {
        const { type } = req.params;
        const term = await termsOfUseRepository_1.termsRepository.findOne({
            where: { type, is_active: true },
        });
        if (!term)
            throw new api_errors_1.NotFoundError("Term active not found");
        return res.json(term);
    }
    async delete(req, res) {
        const { term_id: id } = req.params;
        const term = await termsOfUseRepository_1.termsRepository.findOneBy({ id });
        if (!term)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.term);
        await termsOfUseRepository_1.termsRepository.remove(term);
        return res.status(204).send();
    }
}
exports.default = new TermsOfUseController();
