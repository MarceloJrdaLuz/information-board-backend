import { Response } from "express"
import { BadRequestError, NotFoundError } from "../../helpers/api-errors"
import { messageErrors } from "../../helpers/messageErrors"
import { termsRepository } from "../../repositories/termsOfUseRepository"
import { CustomRequest, ParamsCustomRequest, QueryCustomRequest } from "../../types/customRequest"
import { BodyCreateTermsOfUse, ParamsDeleteTermsOfUse, ParamsGetActiveTermsOfUse, QueryListTermsOfUse } from "./types"

class TermsOfUseController {
    async create(req: CustomRequest<BodyCreateTermsOfUse>, res: Response) {
        const { title, type, content, version, is_active } = req.body

        if (!title || !type || !content || !version) {
            throw new BadRequestError("All fields are required: title, type, content, version")
        }

        const existingTerm = await termsRepository.findOne({
            where: { type, content, version },
        })

        if (existingTerm) {
            throw new BadRequestError(
                `A term with the same content already exists for type "${type}"`
            )
        }

        // se is_active = true, desativa outros termos do mesmo tipo
        if (is_active) {
            await termsRepository.update({ type }, { is_active: false })
        }

        const term = termsRepository.create({
            title,
            type,
            content,
            version,
            is_active: !!is_active,
        })

        const savedTerm = await termsRepository.save(term)

        return res.status(201).json(savedTerm)
    }

    async list(req: QueryCustomRequest<QueryListTermsOfUse>, res: Response) {
        const { type } = req.query
        const terms = await termsRepository.find({
            where: { type: type as "congregation" | "publisher" },
            order: { created_at: "DESC" },
        })
        return res.json(terms)
    }

    async getActive(req: ParamsCustomRequest<ParamsGetActiveTermsOfUse>, res: Response) {
        const { type } = req.params
        const term = await termsRepository.findOne({
            where: { type, is_active: true },
        })
        if (!term) throw new NotFoundError("Term active not found")
        return res.json(term)
    }

    async delete(req: ParamsCustomRequest<ParamsDeleteTermsOfUse>, res: Response) {
        const { term_id: id } = req.params
        const term = await termsRepository.findOneBy({ id })
        if (!term) throw new NotFoundError(messageErrors.notFound.term)

        await termsRepository.remove(term)
        return res.status(204).send()
    }
}

export default new TermsOfUseController()
