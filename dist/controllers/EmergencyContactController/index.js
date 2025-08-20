"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const publisherRepository_1 = require("../../repositories/publisherRepository");
const emergencyContact_1 = require("../../repositories/emergencyContact");
const typeorm_1 = require("typeorm");
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
class EmergencyContactController {
    // Listar todos os contatos de emergência de uma congregação (via publishers)
    async listByCongregation(req, res) {
        const { congregation_id } = req.params;
        const publishers = await publisherRepository_1.publisherRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["emergencyContacts"]
        });
        const contacts = publishers.flatMap(pub => pub.emergencyContacts);
        // Remover duplicatas
        const uniqueContacts = Array.from(new Map(contacts.map(c => [c.id, c])).values());
        return res.json(uniqueContacts);
    }
    // Criar um novo contato de emergência e associar a um ou mais publishers
    async create(req, res) {
        const { name, phone, relationship, isTj, publisherIds } = req.body;
        let contact = await emergencyContact_1.emergencyContactRepository.findOne({
            where: { name, phone },
            relations: ["publishers"]
        });
        if (!contact) {
            contact = emergencyContact_1.emergencyContactRepository.create({ name, phone, relationship, isTj });
            await emergencyContact_1.emergencyContactRepository.save(contact);
            // Buscar novamente para garantir que contact.publishers exista
            contact = await emergencyContact_1.emergencyContactRepository.findOne({
                where: { name, phone },
                relations: ["publishers"]
            });
        }
        if (publisherIds && publisherIds.length && contact) {
            const publishers = await publisherRepository_1.publisherRepository.findBy({ id: (0, typeorm_1.In)(publisherIds) });
            // Mescla os publishers já existentes com os novos, sem duplicar
            const publisherSet = new Map((contact.publishers || []).map(pub => [pub.id, pub]));
            for (const pub of publishers) {
                publisherSet.set(pub.id, pub);
            }
            contact.publishers = Array.from(publisherSet.values());
        }
        if (contact) {
            await emergencyContact_1.emergencyContactRepository.save(contact);
            return res.status(201).json(contact);
        }
        else {
            // Isso nunca deve acontecer, mas é bom garantir
            return res.status(500).json({ message: "Erro ao criar contato de emergência." });
        }
    }
    // Atualizar um contato de emergência
    async update(req, res) {
        const { emergencyContact_id: id } = req.params;
        const { name, phone, relationship, isTj, publisherIds } = req.body;
        const contact = await emergencyContact_1.emergencyContactRepository.findOne({
            where: {
                id
            },
            relations: ["publishers"]
        });
        if (!contact) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.emergencyContact);
        }
        contact.name = name !== null && name !== void 0 ? name : contact.name;
        contact.phone = phone !== null && phone !== void 0 ? phone : contact.phone;
        contact.relationship = relationship !== null && relationship !== void 0 ? relationship : contact.relationship;
        contact.isTj = isTj !== null && isTj !== void 0 ? isTj : contact.isTj;
        if (publisherIds && publisherIds.length) {
            const publishers = await publisherRepository_1.publisherRepository.findBy({ id: (0, typeorm_1.In)(publisherIds) });
            // Mescla os publishers já existentes com os novos, sem duplicar
            const publisherSet = new Map((contact.publishers || []).map(pub => [pub.id, pub]));
            for (const pub of publishers) {
                publisherSet.set(pub.id, pub);
            }
            contact.publishers = Array.from(publisherSet.values());
        }
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
        await emergencyContact_1.emergencyContactRepository.remove(contact);
        return res.status(204).send();
    }
}
exports.default = new EmergencyContactController();
