import { Response } from "express";
import { BadRequestError } from "../../helpers/api-errors";
import { categoryRepository } from "../../repositories/categoryRepository";
import { congregationRepository } from "../../repositories/congregationRepository";
import { documentRepository } from "../../repositories/documentRepository";
import { BodyDocumentsCreateTypes, BodyDocumentsFilterTypes, CustomRequest } from "./type";

class DocumentController {
    async create(req: CustomRequest<BodyDocumentsCreateTypes>, res: Response) {
        const { fileName, size, key, url, category_id, congregation_id } = req.body

        const category = await categoryRepository.findOneBy({ id: category_id })

        const congregation = await congregationRepository.findOneBy({ id: Number(congregation_id) })

        if (!category) {
            throw new BadRequestError('Category not exists')
        }

        if (!congregation) {
            throw new BadRequestError('Congregation not exists')
        }

        const newDocument = await documentRepository.create({
            fileName,
            size,
            key,
            url,
            category,
            congregation
        })

        const document = {
            fileName,
            size,
            key,
            url,
            category: newDocument.category.id,
            congregation: newDocument.congregation.id
        }

        await documentRepository.save(newDocument)

        return res.status(201).json(document)
    }

    async filter(req: CustomRequest<BodyDocumentsFilterTypes>, res: Response) {
        const { congregation_id } = req.body

        const documents = await documentRepository.find({
           
        })

        console.log(documents)
    }
}

export default new DocumentController()