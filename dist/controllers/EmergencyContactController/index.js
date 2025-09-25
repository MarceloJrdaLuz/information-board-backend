"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const emergencyContact_1 = require("../../repositories/emergencyContact");
class EmergencyContactController {
    // Listar todos os contatos de emergência de uma congregação (via publishers)
    async listByCongregation(req, res) {
        const { congregation_id } = req.params;
        const contacts = await emergencyContact_1.emergencyContactRepository.find({
            where: { congregation: { id: congregation_id } },
        });
        return res.json(contacts);
    }
    async create(req, res) {
        const { name, phone, relationship, isTj, congregation_id } = req.body;
        const congregation = await congregationRepository_1.congregationRepository.findOne({
            where: { id: congregation_id },
        });
        if (!congregation) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        }
        let contact = await emergencyContact_1.emergencyContactRepository.findOne({
            where: { name, phone, congregation: { id: congregation_id } },
        });
        if (!contact) {
            contact = emergencyContact_1.emergencyContactRepository.create({
                name,
                phone,
                relationship,
                isTj,
                congregation,
            });
            await emergencyContact_1.emergencyContactRepository.save(contact);
        }
        return res.status(201).json(contact);
    }
    async getEmergencyContact(req, res) {
        const { emergencyContact_id } = req.params;
        const emergencyContact = await emergencyContact_1.emergencyContactRepository.findOneBy({ id: emergencyContact_id });
        if (!emergencyContact)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.emergencyContact);
        return res.status(200).json(emergencyContact);
    }
    // Atualizar um contato de emergência
    async update(req, res) {
        const { emergencyContact_id: id } = req.params;
        const { name, phone, relationship, isTj } = req.body;
        const contact = await emergencyContact_1.emergencyContactRepository.findOne({ where: { id } });
        if (!contact)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.emergencyContact);
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
        const contact = await emergencyContact_1.emergencyContactRepository.findOne({ where: { id } });
        if (!contact)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.emergencyContact);
        // Ao deletar, os publishers que apontam para este contato terão emergencyContact = NULL
        await emergencyContact_1.emergencyContactRepository.remove(contact);
        return res.status(204).send();
    }
}
exports.default = new EmergencyContactController();
