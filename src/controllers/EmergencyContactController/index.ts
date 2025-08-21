import { Response } from "express"
import { publisherRepository } from "../../repositories/publisherRepository"
import {
    BodyEmergencyCreateTypes,
    BodyUpdateEmergencyContactTypes,
    ParamsDeleteEmergencyContactsTypes,
    ParamsListEmergencyContactsTypes,
    ParamsUpdateEmergencyContactsTypes
} from "./types"
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
            relations: ["emergencyContact"]
        })

        const contacts = publishers
            .map(pub => pub.emergencyContact)
            .filter((c): c is NonNullable<typeof c> => c !== null && c !== undefined);

        return res.json(contacts)
    }

    // Criar um novo contato de emergência e associar a um ou mais publishers
    async create(req: CustomRequest<BodyEmergencyCreateTypes>, res: Response) {
        const { name, phone, relationship, isTj, publisherId } = req.body

        let contact = await emergencyContactRepository.findOne({
            where: { name, phone }
        })

        if (!contact) {
            contact = emergencyContactRepository.create({ name, phone, relationship, isTj })
            await emergencyContactRepository.save(contact)
        }

        if (publisherId && contact) {
            const publisher = await publisherRepository.findOneBy({ id: publisherId });
            if (publisher) {
                publisher.emergencyContact = contact;
                await publisherRepository.save(publisher);
            }
        }

        return res.status(201).json(contact)
    }

    // Atualizar um contato de emergência
    async update(req: CustomRequestPT<ParamsUpdateEmergencyContactsTypes, BodyUpdateEmergencyContactTypes>, res: Response) {
        const { emergencyContact_id: id } = req.params
        const { name, phone, relationship, isTj } = req.body

        const contact = await emergencyContactRepository.findOne({
            where: { id }
        })

        if (!contact) {
            throw new NotFoundError(messageErrors.notFound.emergencyContact)
        }

        // Atualiza os dados do contato
        contact.name = name ?? contact.name
        contact.phone = phone ?? contact.phone
        contact.relationship = relationship ?? contact.relationship
        contact.isTj = isTj ?? contact.isTj

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

        // Ao deletar, os publishers que apontam para este contato terão emergencyContact = NULL
        await emergencyContactRepository.remove(contact)

        return res.status(204).send()
    }
}

export default new EmergencyContactController()
