import { Response } from "express";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { congregationRepository } from "../../repositories/congregationRepository";
import { BodyCongregationCreateTypes, BodyCustomRequest, QueryCongregationDeleteTypes, QueryCustomRequest } from "./type";

class CongregationController {
    async create(req: BodyCustomRequest<BodyCongregationCreateTypes>, res: Response) {
        const { name, number, city } = req.body

        const congExists = await congregationRepository.findOneBy({ number })

        if (congExists) {
            throw new BadRequestError('Congregation already exists')
        }

        const newCongregation = {
            name,
            number,
            city
        }

        await congregationRepository.save(newCongregation)

        return res.status(201).json({ newCongregation })
    }

    async delete(req: QueryCustomRequest<QueryCongregationDeleteTypes>, res: Response) {
        const { id } = req.params

        const congregation = await congregationRepository.findOneBy({ id })

        if (!congregation) {
            throw new NotFoundError('Congregation not found')
        }

        await congregationRepository.remove(congregation)

        return res.status(200).end()
    }
}

export default new CongregationController()
