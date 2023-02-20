import { Request, Response } from "express";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { congregationRepository } from "../../repositories/congregationRepository";
import { BodyCongregationCreateTypes, BodyCustomRequest, QueryCongregationDeleteTypes, QueryCustomRequest, QueryGetCongregationTypes } from "./type";

class CongregationController {
    async create(req: BodyCustomRequest<BodyCongregationCreateTypes>, res: Response) {
        const { name, number, city, imageUrl, circuit } = req.body

        const congExists = await congregationRepository.findOneBy({ number })

        if (congExists) {
            throw new BadRequestError('Congregation already exists')
        }

        const newCongregation = {
            name,
            number,
            city,
            circuit,
            imageUrl
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

    async list(req: Request, res: Response) {
        const congExists = await congregationRepository.find({})

        if (!congExists) {
            throw new NotFoundError('Congregations not found')
        }

        return res.status(200).json(congExists)
    }

    async getCongregation(req: QueryCustomRequest<QueryGetCongregationTypes>, res: Response) {

        const { number } = req.params

        const congExists = await congregationRepository.findOneBy({number})

        if (!congExists) {
            throw new NotFoundError('Congregation not found')
        }

        return res.status(200).json(congExists)
    }
}

export default new CongregationController()
