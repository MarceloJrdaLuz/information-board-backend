import { Response } from "express";
import { config } from "../../config";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../helpers/api-errors";
import { categoryRepository } from "../../repositories/categoryRepository";
import { congregationRepository } from "../../repositories/congregationRepository";
import { documentRepository } from "../../repositories/documentRepository";
import { deleteFirebase, firebaseUpload } from "../../provider/firebaseStorage";
import { NormalizeFiles } from "../../types/normalizeFile";
import { BodyDocumentsCreateTypes, ParamsDocumentDeleteTypes, ParamsDocumentsFilterTypes } from "./types";
import fs from 'fs-extra'
import { CustomRequest, ParamsCustomRequest } from "../../types/customRequest";
class DocumentController {
    async create(req: CustomRequest<BodyDocumentsCreateTypes>, res: Response) {
        const { category_id, congregation_id } = req.body
        const file = req.file

        const category = await categoryRepository.findOneBy({ id: category_id })
        const congregation = await congregationRepository.findOneBy({ id: congregation_id })

        if (!category) {
            throw new BadRequestError('Category not exists')
        }

        if (!congregation) {
            throw new BadRequestError('Congregation not exists')
        }

        if (!file) {
            throw new NotFoundError('Any file found')
        }

        switch (config.storage_type) {
            case 'local':
                fs.move(`./tmp/uploads/${req.file?.filename}`, `./tmp/uploads/documents/${congregation.number}/${req.file?.filename}`, function (err) {
                    if (err) {
                        console.log(err)
                    }
                })
                res.status(201).json({ message: 'Moved' })
                break;
            case 'firebase':
                await firebaseUpload(req, res, `documents/${congregation.number}`, saveBD)
                break;
            default:
                res.send('Storage local type is not defined at .env')
                break;
        }


        async function saveBD(file: NormalizeFiles) {
            const { fileName, size, key, url } = file
            const newDocument = documentRepository.create({
                //@ts-expect-error
                fileName: Buffer.from(fileName, 'latin1').toString('utf8'),
                size,
                key,
                url,
                congregation,
                category
            })

            await documentRepository.save(newDocument)

            res.status(201).json(newDocument)
        }
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
                id,
                fileName,
                size,
                key,
                url,
                category: {
                    id: category.id,
                    name: category.name,
                    description: category.description
                }
            }
        })

        return res.status(200).json(documentMap)
    }

    async delete(req: ParamsCustomRequest<ParamsDocumentDeleteTypes>, res: Response) {
        const { document_id } = req.params

        const document = await documentRepository.findOneBy({ id: document_id })

        if (!document) {
            throw new NotFoundError('Document not found')
        }

        await deleteFirebase(document.key)

        await documentRepository.remove(document)

        return res.status(200).end()
    }
}

export default new DocumentController()