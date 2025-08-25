import { Response } from "express";
import {
    BodyEmergencyCreateTypes,
    BodyUpdateEmergencyContactTypes,
    ParamsDeleteEmergencyContactsTypes,
    ParamsListEmergencyContactsTypes,
    ParamsUpdateEmergencyContactsTypes
} from "./types";
import { CustomRequest, CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest";
import { emergencyContactRepository } from "../../repositories/emergencyContact";
import { publisherRepository } from "../../repositories/publisherRepository";
import { NotFoundError } from "../../helpers/api-errors";
import { messageErrors } from "../../helpers/messageErrors";
import { congregationRepository } from "../../repositories/congregationRepository";

class EmergencyContactController {
    // Listar todos os contatos de emergência de uma congregação (via publishers)
    async listByCongregation(req: ParamsCustomRequest<ParamsListEmergencyContactsTypes>, res: Response) {
        const { congregation_id } = req.params;

        const contacts = await emergencyContactRepository.find({
            where: { congregation: { id: congregation_id } },
        });

        return res.json(contacts);
    }

    async create(
        req: CustomRequest<BodyEmergencyCreateTypes & { congregation_id: string }>,
        res: Response
    ) {
        const { name, phone, relationship, isTj, congregation_id } = req.body;
        const congregation = await congregationRepository.findOne({
            where: { id: congregation_id },
        });

        if (!congregation) {
            throw new NotFoundError(messageErrors.notFound.congregation);
        }

        let contact = await emergencyContactRepository.findOne({
            where: { name, phone, congregation: { id: congregation_id } },
        });

        if (!contact) {
            contact = emergencyContactRepository.create({
                name,
                phone,
                relationship,
                isTj,
                congregation,
            });
            await emergencyContactRepository.save(contact);
        }

        return res.status(201).json(contact);
    }

      async getEmergencyContact(req: ParamsCustomRequest<ParamsUpdateEmergencyContactsTypes>, res: Response) {
        const { emergencyContact_id } = req.params
    
        const emergencyContact = await emergencyContactRepository.findOneBy({ id: emergencyContact_id })
    
        if (!emergencyContact) throw new NotFoundError(messageErrors.notFound.emergencyContact)
    
        return res.status(200).json(emergencyContact)
      }


    // Atualizar um contato de emergência
    async update(req: CustomRequestPT<ParamsUpdateEmergencyContactsTypes, BodyUpdateEmergencyContactTypes>, res: Response) {
        const { emergencyContact_id: id } = req.params;
        const { name, phone, relationship, isTj } = req.body;

        const contact = await emergencyContactRepository.findOne({ where: { id } });
        if (!contact) throw new NotFoundError(messageErrors.notFound.emergencyContact);

        contact.name = name ?? contact.name;
        contact.phone = phone ?? contact.phone;
        contact.relationship = relationship ?? contact.relationship;
        contact.isTj = isTj ?? contact.isTj;

        await emergencyContactRepository.save(contact);

        return res.json(contact);
    }

    // Remover um contato de emergência
    async delete(req: ParamsCustomRequest<ParamsDeleteEmergencyContactsTypes>, res: Response) {
        const { emergencyContact_id: id } = req.params;

        const contact = await emergencyContactRepository.findOne({ where: { id } });
        if (!contact) throw new NotFoundError(messageErrors.notFound.emergencyContact);

        // Ao deletar, os publishers que apontam para este contato terão emergencyContact = NULL
        await emergencyContactRepository.remove(contact);

        return res.status(204).send();
    }
}

export default new EmergencyContactController();
