import { Response } from "express";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../helpers/api-errors";
import { categoryRepository } from "../../repositories/categoryRepository";
import { congregationRepository } from "../../repositories/congregationRepository";
import { documentRepository } from "../../repositories/documentRepository";
import { BodyDocumentsCreateTypes, CustomRequest, ParamsCustomRequest, ParamsDocumentDeleteTypes, ParamsDocumentsFilterTypes } from "./type";

class DocumentController {
    async create(req: CustomRequest<BodyDocumentsCreateTypes>, res: Response) {
        const { fileName, size, key, url, category_id, congregation_id, user_id } = req.body

        const category = await categoryRepository.findOneBy({ id: category_id })

        const congregation = await congregationRepository.findOneBy({ id: congregation_id })

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

    async filter(req: ParamsCustomRequest<ParamsDocumentsFilterTypes>, res: Response) {
        const { congregation_id } = req.params

        const documents = await documentRepository.find({
            where: {
                congregation: {
                    id: congregation_id
                }
            }
        })

        if (!documents) {
            throw new BadRequestError('Document not found!')
        }

        const documentMap = documents.map(doc => {
            const { id, fileName, size, key, url, category } = doc
            return {
                id, fileName, size, key, url
            }
        })

        return res.status(200).json(documentMap)
    }

    async delete(req: ParamsCustomRequest<ParamsDocumentDeleteTypes>, res: Response){
        const { document_id } = req.params

        const document = await documentRepository.findOneBy({ id: document_id})

        if(!document){
            throw new NotFoundError('Document not found')
        }

        await documentRepository.remove(document)

        return res.status(200).end()
    }
}

export default new DocumentController()