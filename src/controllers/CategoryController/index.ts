import { Response } from "express";
import { Request } from "express-serve-static-core";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { categoryRepository } from "../../repositories/categoryRepository";
import { BodyCategoryCreateTypes } from "./type";
import { CustomRequest } from "../../types/customRequest";

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

        const newCategory = categoryRepository.create({
            name,
            description
        })

        await categoryRepository.save(newCategory)

        return res.status(201).json(newCategory)
    }

    async getCategories(req: Request, res: Response){
        const categories = await categoryRepository.find({})

        if(!categories) throw new NotFoundError("No category found")

        return res.status(200).json(categories)
    }
}   

export default new CategoryController()