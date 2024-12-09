import { Response } from "express"
import { BodyTerritoryHistoryCreateTypes, ParamsTerritoryHistoryCreateTypes, ParamsTerritoryHistoryDeleteTypes, ParamsTerritoryHistoryUpdateTypes } from "./types"
import { CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest"

class TerritoryHistoryController {
    async create(req: CustomRequestPT<ParamsTerritoryHistoryCreateTypes, BodyTerritoryHistoryCreateTypes>, res: Response) {
        const { territory_id } = req.params
        const { assignment_date, caretaker, completion_date } = req.body
    }

    async update(req: ParamsCustomRequest<ParamsTerritoryHistoryUpdateTypes>, res: Response) {

    }

    async delete(req: ParamsCustomRequest<ParamsTerritoryHistoryDeleteTypes>, res: Response) {

    }
}

export default new TerritoryHistoryController()