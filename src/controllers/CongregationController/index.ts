import { Response } from "express";
import { BadRequestError } from "../../helpers/api-errors";
import { congregationRepository } from "../../repositories/congregationRepository";
import { BodyCongregationCreateTypes, CustomRequest } from "./type";

class CongregationController {
    async create(req: CustomRequest<BodyCongregationCreateTypes>, res: Response) {
        const { name, number, city } = req.body

        const congExists = await congregationRepository.findOneBy({ number })

        if(congExists){
            throw new BadRequestError('Congregation already exists')
        }

        const newCongregation = {
            name,
            number,
            city
        }

        await congregationRepository.save(newCongregation)

        return res.status(201).json({newCongregation})
    }
    
}

export default new CongregationController()
