"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const hospitalityWeekendRepository_1 = require("../../repositories/hospitalityWeekendRepository");
const hospitalityAssignmentRepository_1 = require("../../repositories/hospitalityAssignmentRepository");
const hospitalityGroupRepository_1 = require("../../repositories/hospitalityGroupRepository");
class HospitalityController {
    async createWeekendsBatch(req, res) {
        var _a;
        const { weekends } = req.body;
        const createdWeekends = [];
        for (const w of weekends) {
            const existingWeekend = await hospitalityWeekendRepository_1.hospitalityWeekendRepository.findOneBy({ date: w.date });
            if (existingWeekend)
                continue;
            const weekend = hospitalityWeekendRepository_1.hospitalityWeekendRepository.create({ date: w.date });
            await hospitalityWeekendRepository_1.hospitalityWeekendRepository.save(weekend);
            if ((_a = w.assignments) === null || _a === void 0 ? void 0 : _a.length) {
                const assignments = [];
                for (const a of w.assignments) {
                    const group = await hospitalityGroupRepository_1.hospitalityGroupRepository.findOneBy({ id: a.group_id });
                    if (!group)
                        throw new api_errors_1.NotFoundError(`Group not found for assignment`);
                    const assignment = hospitalityAssignmentRepository_1.hospitalityAssignmentRepository.create({
                        weekend,
                        group,
                        eventType: a.eventType,
                    });
                    await hospitalityAssignmentRepository_1.hospitalityAssignmentRepository.save(assignment);
                    assignments.push(assignment);
                }
                weekend.assignments = assignments;
            }
            createdWeekends.push(weekend);
        }
        return res.status(201).json({ created: createdWeekends.length, weekends: createdWeekends });
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
    async getWeekends(req, res) {
        const weekends = await hospitalityWeekendRepository_1.hospitalityWeekendRepository.find({
            relations: ["assignments", "assignments.group"],
            order: { date: "ASC" },
        });
        return res.json(weekends);
    }
    async updateAssignment(req, res) {
        const { assignment_id } = req.params;
        const { eventType, group_id } = req.body;
        const assignment = await hospitalityAssignmentRepository_1.hospitalityAssignmentRepository.findOne({ where: { id: assignment_id }, relations: ["group"] });
        if (!assignment)
            throw new api_errors_1.NotFoundError("Assignment not found");
        if (group_id) {
            const group = await hospitalityGroupRepository_1.hospitalityGroupRepository.findOneBy({ id: group_id });
            if (!group)
                throw new api_errors_1.NotFoundError("Group not found");
            assignment.group = group;
        }
        assignment.eventType = eventType !== null && eventType !== void 0 ? eventType : assignment.eventType;
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
