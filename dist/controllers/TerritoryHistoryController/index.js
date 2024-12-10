"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const territoryRepository_1 = require("../../repositories/territoryRepository");
const api_errors_1 = require("../../helpers/api-errors");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const territoryHistoryRepository_1 = require("../../repositories/territoryHistoryRepository");
class TerritoryHistoryController {
    async create(req, res) {
        const { territory_id: id } = req.params;
        const { assignment_date, caretaker, completion_date } = req.body;
        const territory = await territoryRepository_1.territoryRepository.findOneBy({ id });
        if (!territory) {
            throw new api_errors_1.NotFoundError("Territory not exists");
        }
        // Validate that the assignment_date is before or equal to the completion_date
        const isValidDates = (0, moment_timezone_1.default)(assignment_date).isSameOrBefore((0, moment_timezone_1.default)(completion_date));
        if (!isValidDates) {
            throw new api_errors_1.BadRequestError("The assignment date must be before or equal to the completion date");
        }
        // Proceed with creating the territory history
        const territoryHistory = territoryHistoryRepository_1.territoryHistoryRepository.create({
            assignment_date,
            caretaker,
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
        const { assignment_date, caretaker, completion_date } = req.body;
        const history = await territoryHistoryRepository_1.territoryHistoryRepository.findOneBy({ id });
        if (!history) {
            throw new api_errors_1.NotFoundError("Territory history not found");
        }
        const isValidDates = (0, moment_timezone_1.default)(assignment_date).isSameOrBefore((0, moment_timezone_1.default)(completion_date));
        if (!isValidDates) {
            throw new api_errors_1.BadRequestError("The assignment date must be before or equal to the completion date");
        }
        // Update the history record
        history.assignment_date = assignment_date || history.assignment_date;
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
            throw new api_errors_1.NotFoundError("Territory history not found");
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
}
exports.default = new TerritoryHistoryController();
