import { Request, Response } from "express";
import { BadRequestError } from "../../helpers/api-errors";
import { MechanicalAutoAssignService } from "../../services/mechanical/MechanicalAutoAssignService";
import { MechanicalScheduleService } from "../../services/mechanical/MechanicalScheduleService";
import { MechanicalRole } from "../../types/mechanical";

export class MechanicalScheduleController {
    private scheduleService: MechanicalScheduleService;
    private autoAssignService: MechanicalAutoAssignService;

    constructor() {
        this.scheduleService = new MechanicalScheduleService();
        this.autoAssignService = new MechanicalAutoAssignService();
    }

    async getConfig(req: Request, res: Response) {
        const { congregation_id } = req.params;
        if (!congregation_id) {
            throw new BadRequestError("ID da congregação é obrigatório.");
        }

        const config = await this.scheduleService.getConfig(congregation_id);
        return res.status(200).json(config);
    }

    async saveConfig(req: Request, res: Response) {
        const { congregation_id } = req.params;
        if (!congregation_id) {
            throw new BadRequestError("ID da congregação é obrigatório.");
        }

        const updated = await this.scheduleService.saveConfig(congregation_id, req.body);
        return res.status(200).json(updated);
    }

    async getMonthSchedules(req: Request, res: Response) {
        const { congregation_id } = req.params;
        const year = Number(req.query.year) || new Date().getFullYear();
        const month = Number(req.query.month) || new Date().getMonth() + 1;
        const monthsCount = Number(req.query.monthsCount) || 1;

        if (!congregation_id) {
            throw new BadRequestError("ID da congregação é obrigatório.");
        }

        const data = await this.scheduleService.getMonthSchedules(congregation_id, year, month, monthsCount);
        return res.status(200).json(data);
    }

    async toggleWeekMeeting(req: Request, res: Response) {
        const { congregation_id } = req.params;
        const { weekStartDate, hasNoMeeting, eventTitle } = req.body;

        if (!congregation_id || !weekStartDate) {
            throw new BadRequestError("congregation_id e weekStartDate são obrigatórios.");
        }

        const result = await this.scheduleService.toggleWeekMeeting(
            congregation_id,
            weekStartDate,
            Boolean(hasNoMeeting),
            eventTitle || null
        );

        return res.status(200).json(result);
    }

    async autoAssignMonth(req: Request, res: Response) {
        const { congregation_id } = req.params;
        const { year, month, forceReassignManual } = req.body;

        if (!congregation_id) {
            throw new BadRequestError("ID da congregação é obrigatório.");
        }
        if (!year || !month) {
            throw new BadRequestError("Ano e mês são obrigatórios.");
        }

        const schedules = await this.autoAssignService.autoAssignMonth(
            congregation_id,
            Number(year),
            Number(month),
            { forceReassignManual: Boolean(forceReassignManual) }
        );

        return res.status(200).json({ success: true, schedules });
    }

    async updateAssignment(req: Request, res: Response) {
        const { assignment_id } = req.params;
        const { publisher_id } = req.body;

        if (!assignment_id) {
            throw new BadRequestError("ID da designação é obrigatório.");
        }

        const updated = await this.scheduleService.updateAssignment(
            assignment_id,
            publisher_id !== undefined ? publisher_id : null
        );

        return res.status(200).json(updated);
    }

    async getSuggestions(req: Request, res: Response) {
        const { congregation_id } = req.params;
        const { schedule_id, role } = req.query;

        if (!congregation_id || !schedule_id || !role) {
            throw new BadRequestError("congregation_id, schedule_id e role são obrigatórios.");
        }

        const suggestions = await this.scheduleService.getPublisherSuggestionsForRole(
            role as MechanicalRole,
            String(schedule_id),
            congregation_id
        );

        return res.status(200).json(suggestions);
    }

    async getQualifications(req: Request, res: Response) {
        const { congregation_id } = req.params;
        if (!congregation_id) {
            throw new BadRequestError("ID da congregação é obrigatório.");
        }

        const qualifications = await this.scheduleService.getQualifications(congregation_id);
        return res.status(200).json(qualifications);
    }

    async toggleQualification(req: Request, res: Response) {
        const { publisher_id, role, enabled } = req.body;

        if (!publisher_id || !role || enabled === undefined) {
            throw new BadRequestError("publisher_id, role e enabled são obrigatórios.");
        }

        const result = await this.scheduleService.toggleQualification(
            publisher_id,
            role as MechanicalRole,
            Boolean(enabled)
        );

        return res.status(200).json(result);
    }
}

export default MechanicalScheduleController;

