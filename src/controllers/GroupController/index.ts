import { Response } from "express-serve-static-core";
import { CustomRequest } from "../../types/customRequest";
import { BodyGroupCreateTypes } from "./type";
import { congregationRepository } from "../../repositories/congregationRepository";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { groupOverseersRepository } from "../../repositories/groupOverseersRepository";
import { groupRepository } from "../../repositories/groupRepository";
import { messageErrors } from "../../helpers/messageErrors";
import { publisherRepository } from "../../repositories/publisherRepository";

class GroupController {
    async create(req: CustomRequest<BodyGroupCreateTypes>, res: Response) {
        const { name, number, congregation_id, publisher_id } = req.body

        const congregation = await congregationRepository.findOneBy({ id: congregation_id })

        if (!congregation) throw new NotFoundError(messageErrors.notFound.congregation)

        if (!publisher_id) throw new BadRequestError("It is necessary to have a group overseer. Create one or provide the id.")

        // Verificar se já existe um grupo com o mesmo nome e número na congregação
        const existingGroup = await groupRepository.findOne({
            where: { congregation: { id: congregation_id }, name, number },
        })

        if (existingGroup) {
            throw new BadRequestError('One group with some name and number already exists in the congregation');
        }

        const publisher = await publisherRepository.findOneBy({ id: publisher_id })

        if (!publisher) throw new NotFoundError(messageErrors.notFound.publisher)

        // Verificar se o publisher já é um grupo de supervisores em algum grupo existente
        const existingGroupWithPublisher = await groupRepository.findOne({
            where: { groupOverseers: { publisher: { id: publisher_id } } }
        })

        if (existingGroupWithPublisher) {
            throw new BadRequestError('The publisher is already a group overseer for another group');
        }

        const newGroupOverseers = groupOverseersRepository.create({
            publisher
        })

        await groupOverseersRepository.save(newGroupOverseers).then((groupOverseers => {
            const { id: groupOverseers_id } = groupOverseers;

            const newGroup = groupRepository.create({
                name,
                number,
                congregation,
                groupOverseers: { id: groupOverseers_id }
            })

            return groupRepository.save(newGroup).then(suc => {

                const { congregation:_, ...rest } = suc 

                return res.json(rest)
            }).catch(err => {
                console.log(err)
                return res.status(500).json(messageErrors.dataBase.save)
            })
        })).catch(err => {
            console.log(err)
            return res.status(500).json(messageErrors.dataBase.save)
        })
    }
}

export default new GroupController()
