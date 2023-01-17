import { Response } from "express";
import { BadRequestError } from "../../helpers/api-errors";
import { categoryRepository } from "../../repositories/categoryRepository";
import { BodyCategoryCreateTypes, CustomRequest } from "./type";

class CategoryController{
    async create(req: CustomRequest<BodyCategoryCreateTypes>, res: Response){
        const { name, description } = req.body

        const categoryExists = await categoryRepository.findOneBy({name})

        const descriptionExists = await categoryRepository.findOneBy({description})

        if(categoryExists){
            throw new BadRequestError('Category already exists')
        }

        if(descriptionExists){
            throw new BadRequestError('Description already exists')
        }

        const newCategory = await categoryRepository.create({
            name,
            description
        })

        await categoryRepository.save(newCategory)

        return res.status(201).json(newCategory)
    }
}   

export default new CategoryController()