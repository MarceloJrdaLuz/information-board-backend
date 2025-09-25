import { Response, Request } from "express";
import {  NotFoundError } from "../../helpers/api-errors";
import { hospitalityWeekendRepository } from "../../repositories/hospitalityWeekendRepository";
import { hospitalityAssignmentRepository } from "../../repositories/hospitalityAssignmentRepository";
import { hospitalityGroupRepository } from "../../repositories/hospitalityGroupRepository";
import { CustomRequest, CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest";
import { BodyWeekendsBatchCreateTypes, ParamsWeekendTypes, ParamsAssignmentTypes, BodyAssignmentCreateTypes } from "./types";

class HospitalityController {
    async createWeekendsBatch(req: CustomRequest<BodyWeekendsBatchCreateTypes>, res: Response) {
        const { weekends } = req.body;
        const createdWeekends = [];

        for (const w of weekends) {
            const existingWeekend = await hospitalityWeekendRepository.findOneBy({ date: w.date });
            if (existingWeekend) continue;

            const weekend = hospitalityWeekendRepository.create({ date: w.date });
            await hospitalityWeekendRepository.save(weekend);

            if (w.assignments?.length) {
                const assignments = [];
                for (const a of w.assignments) {
                    const group = await hospitalityGroupRepository.findOneBy({ id: a.group_id });
                    if (!group) throw new NotFoundError(`Group not found for assignment`);
                    const assignment = hospitalityAssignmentRepository.create({
                        weekend,
                        group,
                        eventType: a.eventType,
                    });
                    await hospitalityAssignmentRepository.save(assignment);
                    assignments.push(assignment);
                }
                weekend.assignments = assignments;
            }

            createdWeekends.push(weekend);
        }

        return res.status(201).json({ created: createdWeekends.length, weekends: createdWeekends });
    }

    async updateAssignmentStatus(
        req: CustomRequestPT<ParamsAssignmentTypes, { completed: boolean }>,
        res: Response
    ) {
        const { assignment_id } = req.params;
        const { completed } = req.body;

        const assignment = await hospitalityAssignmentRepository.findOneBy({ id: assignment_id });
        if (!assignment) throw new NotFoundError("Assignment not found");

        assignment.completed = completed;

        await hospitalityAssignmentRepository.save(assignment);
        return res.json(assignment);
    }

    async getWeekends(req: Request, res: Response) {
        const weekends = await hospitalityWeekendRepository.find({
            relations: ["assignments", "assignments.group"],
            order: { date: "ASC" },
        });

        return res.json(weekends);
    }

    async updateAssignment(
        req: CustomRequestPT<ParamsAssignmentTypes, BodyAssignmentCreateTypes>,
        res: Response
    ) {
        const { assignment_id } = req.params;
        const { eventType, group_id } = req.body;

        const assignment = await hospitalityAssignmentRepository.findOne({ where: { id: assignment_id }, relations: ["group"] });
        if (!assignment) throw new NotFoundError("Assignment not found");

        if (group_id) {
            const group = await hospitalityGroupRepository.findOneBy({ id: group_id });
            if (!group) throw new NotFoundError("Group not found");
            assignment.group = group;
        }

        assignment.eventType = eventType ?? assignment.eventType;

        await hospitalityAssignmentRepository.save(assignment);
        return res.json(assignment);
    }

    async deleteAssignment(req: ParamsCustomRequest<ParamsAssignmentTypes>, res: Response) {
        const { assignment_id } = req.params;
        const assignment = await hospitalityAssignmentRepository.findOneBy({ id: assignment_id });
        if (!assignment) throw new NotFoundError("Assignment not found");

        await hospitalityAssignmentRepository.remove(assignment);
        return res.status(200).end();
    }

    async deleteWeekend(req: ParamsCustomRequest<ParamsWeekendTypes>, res: Response) {
        const { weekend_id } = req.params;
        const weekend = await hospitalityWeekendRepository.findOneBy({ id: weekend_id });
        if (!weekend) throw new NotFoundError("Weekend not found");

        await hospitalityWeekendRepository.remove(weekend);
        return res.status(200).end();
    }
}

export default new HospitalityController();
