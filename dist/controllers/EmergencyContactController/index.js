"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const publisherRepository_1 = require("../../repositories/publisherRepository");
const emergencyContact_1 = require("../../repositories/emergencyContact");
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
class EmergencyContactController {
    // Listar todos os contatos de emergência de uma congregação (via publishers)
    async listByCongregation(req, res) {
        const { congregation_id } = req.params;
        const publishers = await publisherRepository_1.publisherRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["emergencyContact"]
        });
        const contacts = publishers
            .map(pub => pub.emergencyContact)
            .filter((c) => c !== null && c !== undefined);
        return res.json(contacts);
    }
    // Criar um novo contato de emergência e associar a um ou mais publishers
    async create(req, res) {
        const { name, phone, relationship, isTj, publisherId } = req.body;
        let contact = await emergencyContact_1.emergencyContactRepository.findOne({
            where: { name, phone }
        });
        if (!contact) {
            contact = emergencyContact_1.emergencyContactRepository.create({ name, phone, relationship, isTj });
            await emergencyContact_1.emergencyContactRepository.save(contact);
        }
        if (publisherId && contact) {
            const publisher = await publisherRepository_1.publisherRepository.findOneBy({ id: publisherId });
            if (publisher) {
                publisher.emergencyContact = contact;
                await publisherRepository_1.publisherRepository.save(publisher);
            }
        }
        return res.status(201).json(contact);
    }
    // Atualizar um contato de emergência
    async update(req, res) {
        const { emergencyContact_id: id } = req.params;
        const { name, phone, relationship, isTj } = req.body;
        const contact = await emergencyContact_1.emergencyContactRepository.findOne({
            where: { id }
        });
        if (!contact) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.emergencyContact);
        }
        // Atualiza os dados do contato
        contact.name = name !== null && name !== void 0 ? name : contact.name;
        contact.phone = phone !== null && phone !== void 0 ? phone : contact.phone;
        contact.relationship = relationship !== null && relationship !== void 0 ? relationship : contact.relationship;
        contact.isTj = isTj !== null && isTj !== void 0 ? isTj : contact.isTj;
        await emergencyContact_1.emergencyContactRepository.save(contact);
        return res.json(contact);
    }
    // Remover um contato de emergência
    async delete(req, res) {
        const { emergencyContact_id: id } = req.params;
        const contact = await emergencyContact_1.emergencyContactRepository.findOne({
            where: { id }
        });
        if (!contact) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.emergencyContact);
        }
        // Ao deletar, os publishers que apontam para este contato terão emergencyContact = NULL
        await emergencyContact_1.emergencyContactRepository.remove(contact);
        return res.status(204).send();
    }
}
exports.default = new EmergencyContactController();
