import { Response } from "express"
import { BodyTerritoryHistoryCreateTypes, BodyTerritoryHistoryUpdateTypes, ParamsTerritoryHistoryCreateTypes, ParamsTerritoryHistoryDeleteTypes, ParamsTerritoryHistoryUpdateTypes } from "./types"
import { CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest"
import { territoryRepository } from "../../repositories/territoryRepository"
import { BadRequestError, NotFoundError } from "../../helpers/api-errors"
import moment from "moment-timezone"
import { territoryHistoryRepository } from "../../repositories/territoryHistoryRepository"

class TerritoryHistoryController {
    async create(req: CustomRequestPT<ParamsTerritoryHistoryCreateTypes, BodyTerritoryHistoryCreateTypes>, res: Response) {
        const { territory_id: id } = req.params
        const { assignment_date, caretaker, completion_date } = req.body

        const territory = await territoryRepository.findOneBy({ id })

        if (!territory) {
            throw new NotFoundError("Territory not exists")
        }

        // Validate that the assignment_date is before or equal to the completion_date
        const isValidDates = moment(assignment_date).isSameOrBefore(moment(completion_date))

        if (!isValidDates) {
            throw new BadRequestError("The assignment date must be before or equal to the completion date")
        }

        // Proceed with creating the territory history
        const territoryHistory = territoryHistoryRepository.create({
            assignment_date,
            caretaker,
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
        const { assignment_date, caretaker, completion_date } = req.body

        const history = await territoryHistoryRepository.findOneBy({ id })

        if (!history) {
            throw new NotFoundError("Territory history not found")
        }

        const isValidDates = moment(assignment_date).isSameOrBefore(moment(completion_date))

        if (!isValidDates) {
            throw new BadRequestError("The assignment date must be before or equal to the completion date")
        }

        // Update the history record
        history.assignment_date = assignment_date || history.assignment_date
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
            throw new NotFoundError("Territory history not found")
        }

        try {
            await territoryHistoryRepository.remove(history)
            return res.send()
        } catch (err) {
            console.error("Error deleting territory history:", err)
            return res.status(500).json({ message: "Internal server error" })
        }
    }
}

export default new TerritoryHistoryController()