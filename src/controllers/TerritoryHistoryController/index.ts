import { Response } from "express"
import moment from "moment-timezone"
import { BadRequestError, NotFoundError } from "../../helpers/api-errors"
import { messageErrors } from "../../helpers/messageErrors"
import { territoryHistoryRepository } from "../../repositories/territoryHistoryRepository"
import { territoryRepository } from "../../repositories/territoryRepository"
import { CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest"
import { BodyTerritoryHistoryCreateTypes, BodyTerritoryHistoryUpdateTypes, ParamsGetTerritoryHistoryTypes, ParamsTerritoryHistoryCreateTypes, ParamsTerritoryHistoryDeleteTypes, ParamsTerritoryHistoryGetTypes, ParamsTerritoryHistoryUpdateTypes } from "./types"

class TerritoryHistoryController {
    async create(req: CustomRequestPT<ParamsTerritoryHistoryCreateTypes, BodyTerritoryHistoryCreateTypes>, res: Response) {
        const { territory_id: id } = req.params
        const { assignment_date, caretaker, completion_date, work_type } = req.body
        const territory = await territoryRepository.findOneBy({ id })

        if (!territory) {
            throw new NotFoundError(messageErrors.notFound.territory)
        }

        // Validate that the assignment_date is before or equal to the completion_date
        const isValidDates = !completion_date || moment(assignment_date).isSameOrBefore(moment(completion_date))

        if (!isValidDates) {
            throw new BadRequestError("The assignment date must be before or equal to the completion date")
        }

        // Proceed with creating the territory history
        const territoryHistory = territoryHistoryRepository.create({
            assignment_date,
            caretaker,
            work_type: work_type ?? "Padrão",
            completion_date,
            territory
        })

        try {
            await territoryHistoryRepository.save(territoryHistory)
            return res.status(201).json(territoryHistory)
        } catch (err) {
            console.error("Error saving territory history:", err)
            return res.status(500).json({ message: "Internal server error" })
        }
    }

    async update(req: CustomRequestPT<ParamsTerritoryHistoryUpdateTypes, BodyTerritoryHistoryUpdateTypes>, res: Response) {
        const { territoryHistory_id: id } = req.params
        const { assignment_date, caretaker, completion_date, work_type } = req.body

        const history = await territoryHistoryRepository.findOneBy({ id })

        if (!history) {
            throw new NotFoundError(messageErrors.notFound.territoryHistory)
        }

        // Validate that the assignment_date is before or equal to the completion_date
        const isValidDates = !completion_date || moment(assignment_date).isSameOrBefore(moment(completion_date))

        if (!isValidDates) {
            throw new BadRequestError("The assignment date must be before or equal to the completion date")
        }

        // Update the history record
        history.assignment_date = assignment_date || history.assignment_date
        history.work_type = work_type || history.work_type
        history.caretaker = caretaker || history.caretaker
        history.completion_date = completion_date || history.completion_date

        try {
            await territoryHistoryRepository.save(history)
            return res.status(200).json(history)
        } catch (err) {
            console.error("Error updating territory history:", err)
            return res.status(500).json({ message: "Internal server error" })
        }
    }

    async delete(req: ParamsCustomRequest<ParamsTerritoryHistoryDeleteTypes>, res: Response) {
        const { territoryHistory_id: id } = req.params

        const history = await territoryHistoryRepository.findOneBy({ id })

        if (!history) {
            throw new NotFoundError(messageErrors.notFound.territoryHistory)
        }

        try {
            await territoryHistoryRepository.remove(history)
            return res.send()
        } catch (err) {
            console.error("Error deleting territory history:", err)
            return res.status(500).json({ message: "Internal server error" })
        }
    }

    async getTerritoryHistory(req: ParamsCustomRequest<ParamsGetTerritoryHistoryTypes>, res: Response) {
        const { territory_id: id } = req.params
        
        if (!id) {
            return res.status(400).json({ error: "Territory ID is required" });
        }

        const history = await territoryHistoryRepository.find({
            where: {
                territory: {
                    id
                }
            }
        })

        return res.status(200).json(history)
    }

    async getTerritoriesHistory(req: ParamsCustomRequest<ParamsTerritoryHistoryGetTypes>, res: Response) {
        const { congregation_id } = req.params
        const history = await territoryHistoryRepository.find({
            where: {
                territory: {
                    congregation: {
                        id: congregation_id
                    }
                }
            }
        })

        if (!history) {
            throw new NotFoundError(messageErrors.notFound.territoryHistory)
        }
        res.send(history)
    }
}

export default new TerritoryHistoryController()