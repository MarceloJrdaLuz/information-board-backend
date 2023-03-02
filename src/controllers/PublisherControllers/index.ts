import { Response } from "express-serve-static-core";
import { BadRequestError } from "../../helpers/api-errors";
import { congregationRepository } from "../../repositories/congregationRepository";
import { publisherRepository } from "../../repositories/publisherRepository";
import { Privileges } from "../../types/privileges";
import { BodyPublisherCreateTypes, BodyPublisherUpdateTypes, CustomRequest, ParamsCustomRequest, ParamsPublisherDeleteTypes } from "./types";

class PublisherControler {
    async create(req: CustomRequest<BodyPublisherCreateTypes>, res: Response) {
        const { fullName, nickname, privileges, congregation_id } = req.body

        const privilegesExists = privileges?.every(privilege => Object.values(Privileges).includes(privilege as Privileges))

        const congregation = await congregationRepository.findOneBy({ id: congregation_id })

        if (!congregation) throw new BadRequestError('Congregation not exists')

        if (!privilegesExists) throw new BadRequestError('Some privilege not exists')

        const newPublisher = publisherRepository.create({
            fullName,
            nickname,
            privileges,
            congregation
        })

        await publisherRepository.save(newPublisher).catch(err => {
            throw new BadRequestError(err)
        })

        return res.status(201).json(newPublisher)
    }

    async update(req: CustomRequest<BodyPublisherUpdateTypes>, res: Response) {
        const { id, fullName, nickname, privileges } = req.body

        const publisher = await publisherRepository.findOneBy({ id })



        if (!publisher) new BadRequestError('Publisher not exists')


        if (privileges) {

            const privilegesExists = privileges?.every(privilege => Object.values(Privileges).includes(privilege as Privileges))

            if (!privilegesExists) throw new BadRequestError('Some privilege not exists')
        }

        if (!fullName && !nickname && !privileges) {
            throw new BadRequestError('Any change detected')
        }

        if (fullName === publisher?.fullName || nickname === publisher?.nickname || privileges === publisher?.privileges)
            throw new BadRequestError('Some field is equal at database') 

        const updatePublisher = {
            fullName: fullName ?? publisher?.fullName,
            nickname: nickname ?? publisher?.nickname,
            privileges: privileges ?? publisher?.privileges,
        }

        await publisherRepository.save({ id, ...updatePublisher }).then(suc => {
            return res.status(201).json(suc)
        }).catch(err => {
            res.send(err)
        })
    }

    async delete(req: ParamsCustomRequest<ParamsPublisherDeleteTypes>, res: Response) {
        const { publisher_id: id } = req.params

        const publisher = await publisherRepository.findOneBy({ id })

        if (!publisher) throw new BadRequestError('Publisher not exists')

        await publisherRepository.remove(publisher)

        return res.status(200).end()
    }
}

export default new PublisherControler()