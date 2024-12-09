"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TerritoryHistoryController {
    async create(req, res) {
        const { territory_id } = req.params;
        const { assignment_date, caretaker, completion_date } = req.body;
    }
    async update(req, res) {
    }
    async delete(req, res) {
    }
}
exports.default = new TerritoryHistoryController();
