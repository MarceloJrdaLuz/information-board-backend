import { Response, Request } from "express";
import { NotFoundError } from "../../helpers/api-errors";
import { hospitalityWeekendRepository } from "../../repositories/hospitalityWeekendRepository";
import { hospitalityAssignmentRepository } from "../../repositories/hospitalityAssignmentRepository";
import { hospitalityGroupRepository } from "../../repositories/hospitalityGroupRepository";
import { CustomRequest, CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest";
import { BodyWeekendsBatchCreateTypes, ParamsWeekendTypes, ParamsAssignmentTypes, BodyAssignmentCreateTypes } from "./types";

class HospitalityController {
    async createOrUpdateBatch(
        req: CustomRequestPT<{ congregation_id: string }, BodyWeekendsBatchCreateTypes>,
        res: Response
    ) {
        const { congregation_id } = req.params;
        const { weekends } = req.body;

        if (!congregation_id) throw new NotFoundError("Congregation not found");

        const result: { created: number; updated: number; deleted: number; weekends: any[] } = {
            created: 0,
            updated: 0,
            deleted: 0,
            weekends: [],
        };

        try {
            for (const w of weekends) {
                let weekend = await hospitalityWeekendRepository.findOne({
                    where: { date: w.date, congregation_id },
                    relations: ["assignments", "assignments.group"],
                });

                if (!weekend) {
                    // Weekend não existe → cria
                    weekend = hospitalityWeekendRepository.create({ date: w.date, congregation_id });
                    await hospitalityWeekendRepository.save(weekend);
                    result.created++;
                } else {
                    result.updated++;
                }

                // Se não houver assignments enviados, remove todos existentes
                if (!w.assignments || w.assignments.length === 0) {
                    if (weekend.assignments?.length) {
                        await hospitalityAssignmentRepository.remove(weekend.assignments);
                        weekend.assignments = [];
                    }

                    // Remove weekend vazio
                    await hospitalityWeekendRepository.remove(weekend);
                    result.deleted++;
                    continue; // pula para o próximo loop
                }

                // Atualiza ou cria assignments
                const assignmentsToKeep: typeof weekend.assignments = [];

                for (const a of w.assignments) {
                    let assignment;
                    if (a.id) {
                        // Assignment existente → atualiza
                        assignment = await hospitalityAssignmentRepository.findOne({
                            where: { id: a.id },
                            relations: ["group"],
                        });
                        if (!assignment) throw new NotFoundError(`Assignment ${a.id} not found`);

                        assignment.eventType = a.eventType;

                        // Se o group_id vier vazio, significa que o evento deve ser removido
                        if (!a.group_id) {
                            // Se o assignment já existia, remove do banco
                            if (a.id) {
                                await hospitalityAssignmentRepository.remove(assignment);
                            }
                            continue; // pula para o próximo assignment
                        }

                        // Caso contrário, mantém ou cria com o grupo informado
                        const group = await hospitalityGroupRepository.findOneBy({ id: a.group_id });
                        if (!group) throw new NotFoundError(`Group ${a.group_id} not found`);

                        assignment.group = group;


                        await hospitalityAssignmentRepository.save(assignment);
                    } else {
                        // Assignment novo → cria
                        if (!a.group_id) {
                            // Não cria assignments sem grupo
                            continue;
                        }
                        const group = await hospitalityGroupRepository.findOneBy({ id: a.group_id });
                        if (!group) throw new NotFoundError(`Group ${a.group_id} not found`);
                        assignment = hospitalityAssignmentRepository.create({
                            weekend,
                            group,
                            eventType: a.eventType,
                        });
                        await hospitalityAssignmentRepository.save(assignment);
                    }

                    assignmentsToKeep.push(assignment);
                }

                // Remove assignments que não estão mais no frontend
                const assignmentsToRemove = weekend.assignments?.filter(
                    existing => !assignmentsToKeep.find(a => a.id === existing.id)
                );
                if (assignmentsToRemove?.length) {
                    await hospitalityAssignmentRepository.remove(assignmentsToRemove);
                }

                weekend.assignments = assignmentsToKeep;
                result.weekends.push(weekend);
            }

            return res.status(200).json(result);
        } catch (err) {
            console.error("Erro em createOrUpdateBatch:", err);
            return res.status(500).json({ message: "Erro ao processar weekends", error: err });
        }
    }

    async getWeekends(req: ParamsCustomRequest<{ congregation_id: string }>, res: Response) {
        const { congregation_id } = req.params;
        if (!congregation_id) throw new NotFoundError("Congregation not found");

        const weekends = await hospitalityWeekendRepository.find({
            where: { congregation_id },
            relations: ["assignments", "assignments.group", "assignments.group.host"],
            order: { date: "ASC" },
        });

        return res.json(weekends);
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
