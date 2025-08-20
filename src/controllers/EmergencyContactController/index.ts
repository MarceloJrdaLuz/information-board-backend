import { Response } from "express"
import { publisherRepository } from "../../repositories/publisherRepository"
import { BodyEmergencyCreateTypes, BodyUpdateEmergencyContactTypes, ParamsDeleteEmergencyContactsTypes, ParamsListEmergencyContactsTypes, ParamsUpdateEmergencyContactsTypes } from "./types"
import { CustomRequest, CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest"
import { emergencyContactRepository } from "../../repositories/emergencyContact"
import { In } from "typeorm"
import { NotFoundError } from "../../helpers/api-errors"
import { messageErrors } from "../../helpers/messageErrors"

class EmergencyContactController {
    // Listar todos os contatos de emergência de uma congregação (via publishers)
    async listByCongregation(req: ParamsCustomRequest<ParamsListEmergencyContactsTypes>, res: Response) {
        const { congregation_id } = req.params
        const publishers = await publisherRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["emergencyContacts"]
        })
        const contacts = publishers.flatMap(pub => pub.emergencyContacts)
        // Remover duplicatas
        const uniqueContacts = Array.from(new Map(contacts.map(c => [c.id, c])).values())
        return res.json(uniqueContacts)
    }

    // Criar um novo contato de emergência e associar a um ou mais publishers
    async create(req: CustomRequest<BodyEmergencyCreateTypes>, res: Response) {
        const { name, phone, relationship, isTj, publisherIds } = req.body

        let contact = await emergencyContactRepository.findOne({
            where: { name, phone },
            relations: ["publishers"]
        })

        if (!contact) {
            contact = emergencyContactRepository.create({ name, phone, relationship, isTj })
            await emergencyContactRepository.save(contact)
            // Buscar novamente para garantir que contact.publishers exista
            contact = await emergencyContactRepository.findOne({
                where: { name, phone },
                relations: ["publishers"]
            })
        }

        if (publisherIds && publisherIds.length && contact) {
            const publishers = await publisherRepository.findBy({ id: In(publisherIds) })

            // Mescla os publishers já existentes com os novos, sem duplicar
            const publisherSet = new Map((contact.publishers || []).map(pub => [pub.id, pub]))
            for (const pub of publishers) {
                publisherSet.set(pub.id, pub)
            }
            contact.publishers = Array.from(publisherSet.values())
        }

        if (contact) {
            await emergencyContactRepository.save(contact)
            return res.status(201).json(contact)
        } else {
            // Isso nunca deve acontecer, mas é bom garantir
            return res.status(500).json({ message: "Erro ao criar contato de emergência." })
        }
    }

    // Atualizar um contato de emergência
    async update(req: CustomRequestPT<ParamsUpdateEmergencyContactsTypes, BodyUpdateEmergencyContactTypes>, res: Response) {
        const { emergencyContact_id: id } = req.params
        const { name, phone, relationship, isTj, publisherIds } = req.body

        const contact = await emergencyContactRepository.findOne({
            where: {
                id
            },
            relations: ["publishers"]
        })

        if (!contact) {
            throw new NotFoundError(messageErrors.notFound.emergencyContact)
        }

        contact.name = name ?? contact.name
        contact.phone = phone ?? contact.phone
        contact.relationship = relationship ?? contact.relationship
        contact.isTj = isTj ?? contact.isTj

        if (publisherIds && publisherIds.length) {
            const publishers = await publisherRepository.findBy({ id: In(publisherIds) })

            // Mescla os publishers já existentes com os novos, sem duplicar
            const publisherSet = new Map((contact.publishers || []).map(pub => [pub.id, pub]))
            for (const pub of publishers) {
                publisherSet.set(pub.id, pub)
            }
            contact.publishers = Array.from(publisherSet.values())
        }

        await emergencyContactRepository.save(contact)
        return res.json(contact)
    }

    // Remover um contato de emergência
    async delete(req: ParamsCustomRequest<ParamsDeleteEmergencyContactsTypes>, res: Response) {
        const { emergencyContact_id: id } = req.params

        const contact = await emergencyContactRepository.findOne({
            where: { id }
        })

        if (!contact) {
            throw new NotFoundError(messageErrors.notFound.emergencyContact)
        }

        await emergencyContactRepository.remove(contact)
        return res.status(204).send()
    }
}

export default new EmergencyContactController()