"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
const territoryHistoryRepository_1 = require("../../repositories/territoryHistoryRepository");
const territoryRepository_1 = require("../../repositories/territoryRepository");
class TerritoryHistoryController {
    async create(req, res) {
        const { territory_id: id } = req.params;
        const { assignment_date, caretaker, completion_date, work_type } = req.body;
        const territory = await territoryRepository_1.territoryRepository.findOneBy({ id });
        if (!territory) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.territory);
        }
        // Validate that the assignment_date is before or equal to the completion_date
        const isValidDates = !completion_date || (0, moment_timezone_1.default)(assignment_date).isSameOrBefore((0, moment_timezone_1.default)(completion_date));
        if (!isValidDates) {
            throw new api_errors_1.BadRequestError("The assignment date must be before or equal to the completion date");
        }
        // Proceed with creating the territory history
        const territoryHistory = territoryHistoryRepository_1.territoryHistoryRepository.create({
            assignment_date,
            caretaker,
            work_type: work_type !== null && work_type !== void 0 ? work_type : "Padrão",
            completion_date,
            territory
        });
        try {
            await territoryHistoryRepository_1.territoryHistoryRepository.save(territoryHistory);
            return res.status(201).json(territoryHistory);
        }
        catch (err) {
            console.error("Error saving territory history:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async update(req, res) {
        const { territoryHistory_id: id } = req.params;
        const { assignment_date, caretaker, completion_date, work_type } = req.body;
        const history = await territoryHistoryRepository_1.territoryHistoryRepository.findOneBy({ id });
        if (!history) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.territoryHistory);
        }
        // Validate that the assignment_date is before or equal to the completion_date
        const isValidDates = !completion_date || (0, moment_timezone_1.default)(assignment_date).isSameOrBefore((0, moment_timezone_1.default)(completion_date));
        if (!isValidDates) {
            throw new api_errors_1.BadRequestError("The assignment date must be before or equal to the completion date");
        }
        // Update the history record
        history.assignment_date = assignment_date || history.assignment_date;
        history.work_type = work_type || history.work_type;
        history.caretaker = caretaker || history.caretaker;
        history.completion_date = completion_date || history.completion_date;
        try {
            await territoryHistoryRepository_1.territoryHistoryRepository.save(history);
            return res.status(200).json(history);
        }
        catch (err) {
            console.error("Error updating territory history:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async delete(req, res) {
        const { territoryHistory_id: id } = req.params;
        const history = await territoryHistoryRepository_1.territoryHistoryRepository.findOneBy({ id });
        if (!history) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.territoryHistory);
        }
        try {
            await territoryHistoryRepository_1.territoryHistoryRepository.remove(history);
            return res.send();
        }
        catch (err) {
            console.error("Error deleting territory history:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async getTerritoryHistory(req, res) {
        const { territory_id: id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Territory ID is required" });
        }
        const history = await territoryHistoryRepository_1.territoryHistoryRepository.find({
            where: {
                territory: {
                    id
                }
            }
        });
        return res.status(200).json(history);
    }
    async getTerritoriesHistory(req, res) {
        const { congregation_id } = req.params;
        const history = await territoryHistoryRepository_1.territoryHistoryRepository.find({
            where: {
                territory: {
                    congregation: {
                        id: congregation_id
                    }
                }
            },
        });
        if (!history) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.territoryHistory);
        }
        res.send(history);
    }
}
exports.default = new TerritoryHistoryController();
