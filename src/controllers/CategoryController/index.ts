import { Response } from "express";
import { Request } from "express-serve-static-core";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { categoryRepository } from "../../repositories/categoryRepository";
import { BodyCategoryCreateTypes, ParamsUpdateCategoryTypes } from "./types";
import { CustomRequest, CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest";
import { messageErrors } from "../../helpers/messageErrors";

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

    async update(req: CustomRequestPT<ParamsUpdateCategoryTypes, BodyCategoryCreateTypes>, res: Response) {
        const { category_id } = req.params
        const { name, description } = req.body

        const category = await categoryRepository.findOneBy({ id: category_id })

        if (!category) throw new NotFoundError(messageErrors.notFound.category)

        category.name = name !== undefined ? name : category.name
        category.description = description !== undefined ? description : category.description

        await categoryRepository.save(category)

        return res.status(201).json(category)
    }

    async getPermission(req: ParamsCustomRequest<ParamsUpdateCategoryTypes>, res: Response) {
        const { category_id } = req.params
    
        const category = await categoryRepository.findOneBy({ id: category_id })
    
        if (!category) throw new NotFoundError(messageErrors.notFound.category)
    
        return res.status(200).json(category)
      }


    async getCategories(req: Request, res: Response){
        const categories = await categoryRepository.find({})

        if(!categories) throw new NotFoundError("No category found")

        return res.status(200).json(categories)
    }


}   

export default new CategoryController()