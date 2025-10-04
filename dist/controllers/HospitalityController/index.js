"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const hospitalityWeekendRepository_1 = require("../../repositories/hospitalityWeekendRepository");
const hospitalityAssignmentRepository_1 = require("../../repositories/hospitalityAssignmentRepository");
const hospitalityGroupRepository_1 = require("../../repositories/hospitalityGroupRepository");
class HospitalityController {
    async createOrUpdateBatch(req, res) {
        var _a, _b;
        const { congregation_id } = req.params;
        const { weekends } = req.body;
        if (!congregation_id)
            throw new api_errors_1.NotFoundError("Congregation not found");
        const result = {
            created: 0,
            updated: 0,
            deleted: 0,
            weekends: [],
        };
        try {
            for (const w of weekends) {
                let weekend = await hospitalityWeekendRepository_1.hospitalityWeekendRepository.findOne({
                    where: { date: w.date, congregation_id },
                    relations: ["assignments", "assignments.group"],
                });
                if (!weekend) {
                    // Weekend não existe → cria
                    weekend = hospitalityWeekendRepository_1.hospitalityWeekendRepository.create({ date: w.date, congregation_id });
                    await hospitalityWeekendRepository_1.hospitalityWeekendRepository.save(weekend);
                    result.created++;
                }
                else {
                    result.updated++;
                }
                // Se não houver assignments enviados, remove todos existentes
                if (!w.assignments || w.assignments.length === 0) {
                    if ((_a = weekend.assignments) === null || _a === void 0 ? void 0 : _a.length) {
                        await hospitalityAssignmentRepository_1.hospitalityAssignmentRepository.remove(weekend.assignments);
                        weekend.assignments = [];
                    }
                    // Remove weekend vazio
                    await hospitalityWeekendRepository_1.hospitalityWeekendRepository.remove(weekend);
                    result.deleted++;
                    continue; // pula para o próximo loop
                }
                // Atualiza ou cria assignments
                const assignmentsToKeep = [];
                for (const a of w.assignments) {
                    let assignment;
                    if (a.id) {
                        // Assignment existente → atualiza
                        assignment = await hospitalityAssignmentRepository_1.hospitalityAssignmentRepository.findOne({
                            where: { id: a.id },
                            relations: ["group"],
                        });
                        if (!assignment)
                            throw new api_errors_1.NotFoundError(`Assignment ${a.id} not found`);
                        assignment.eventType = a.eventType;
                        if (a.group_id) {
                            const group = await hospitalityGroupRepository_1.hospitalityGroupRepository.findOneBy({ id: a.group_id });
                            if (!group)
                                throw new api_errors_1.NotFoundError(`Group ${a.group_id} not found`);
                            assignment.group = group;
                        }
                        await hospitalityAssignmentRepository_1.hospitalityAssignmentRepository.save(assignment);
                    }
                    else {
                        // Assignment novo → cria
                        const group = await hospitalityGroupRepository_1.hospitalityGroupRepository.findOneBy({ id: a.group_id });
                        if (!group)
                            throw new api_errors_1.NotFoundError(`Group ${a.group_id} not found`);
                        assignment = hospitalityAssignmentRepository_1.hospitalityAssignmentRepository.create({
                            weekend,
                            group,
                            eventType: a.eventType,
                        });
                        await hospitalityAssignmentRepository_1.hospitalityAssignmentRepository.save(assignment);
                    }
                    assignmentsToKeep.push(assignment);
                }
                // Remove assignments que não estão mais no frontend
                const assignmentsToRemove = (_b = weekend.assignments) === null || _b === void 0 ? void 0 : _b.filter(existing => !assignmentsToKeep.find(a => a.id === existing.id));
                if (assignmentsToRemove === null || assignmentsToRemove === void 0 ? void 0 : assignmentsToRemove.length) {
                    await hospitalityAssignmentRepository_1.hospitalityAssignmentRepository.remove(assignmentsToRemove);
                }
                weekend.assignments = assignmentsToKeep;
                result.weekends.push(weekend);
            }
            return res.status(200).json(result);
        }
        catch (err) {
            console.error("Erro em createOrUpdateBatch:", err);
            return res.status(500).json({ message: "Erro ao processar weekends", error: err });
        }
    }
    async getWeekends(req, res) {
        const { congregation_id } = req.params;
        if (!congregation_id)
            throw new api_errors_1.NotFoundError("Congregation not found");
        const weekends = await hospitalityWeekendRepository_1.hospitalityWeekendRepository.find({
            where: { congregation_id },
            relations: ["assignments", "assignments.group", "assignments.group.host"],
            order: { date: "ASC" },
        });
        return res.json(weekends);
    }
    async updateAssignmentStatus(req, res) {
        const { assignment_id } = req.params;
        const { completed } = req.body;
        const assignment = await hospitalityAssignmentRepository_1.hospitalityAssignmentRepository.findOneBy({ id: assignment_id });
        if (!assignment)
            throw new api_errors_1.NotFoundError("Assignment not found");
        assignment.completed = completed;
        await hospitalityAssignmentRepository_1.hospitalityAssignmentRepository.save(assignment);
        return res.json(assignment);
    }
    async deleteAssignment(req, res) {
        const { assignment_id } = req.params;
        const assignment = await hospitalityAssignmentRepository_1.hospitalityAssignmentRepository.findOneBy({ id: assignment_id });
        if (!assignment)
            throw new api_errors_1.NotFoundError("Assignment not found");
        await hospitalityAssignmentRepository_1.hospitalityAssignmentRepository.remove(assignment);
        return res.status(200).end();
    }
    async deleteWeekend(req, res) {
        const { weekend_id } = req.params;
        const weekend = await hospitalityWeekendRepository_1.hospitalityWeekendRepository.findOneBy({ id: weekend_id });
        if (!weekend)
            throw new api_errors_1.NotFoundError("Weekend not found");
        await hospitalityWeekendRepository_1.hospitalityWeekendRepository.remove(weekend);
        return res.status(200).end();
    }
}
exports.default = new HospitalityController();
