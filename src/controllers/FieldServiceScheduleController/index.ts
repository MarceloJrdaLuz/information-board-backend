import { Request, Response } from "express";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { fieldServiceScheduleRepository } from "../../repositories/fieldServiceScheduleRepository";
import { publisherRepository } from "../../repositories/publisherRepository";
import { CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest";
import {
    BodyCreateFieldServiceSchedule,
    BodyUpdateFieldServiceSchedule,
    ParamsCreateFieldServiceSchedule,
    ParamsDeleteFieldServiceSchedule,
    ParamsGetOneFieldServiceSchedule,
    ParamsGetSchedulesByTemplate,
    ParamsUpdateFieldServiceSchedule,
} from "./types";
import { fieldServiceTemplateRepository } from "../../repositories/fieldServiceTemplateRepository";
import { generateFieldServiceSchedules } from "../../services/fieldService/generateFieldServiceSchedules";
import { buildFieldServicePdfData } from "../../services/fieldService/buildFieldServicePdfData";
import dayjs from "dayjs";

class FieldServiceScheduleController {
    async create(
        req: CustomRequestPT<
            ParamsCreateFieldServiceSchedule,
            BodyCreateFieldServiceSchedule
        >,
        res: Response
    ) {
        const { template_id } = req.params;
        const { date, leader_id } = req.body;

        if (!date || !leader_id) {
            throw new BadRequestError("date and leader_id are required");
        }

        const template = await fieldServiceTemplateRepository.findOne({
            where: { id: template_id },
        });

        if (!template) {
            throw new NotFoundError("Field service template not found");
        }

        const leader = await publisherRepository.findOne({
            where: { id: leader_id },
        });

        if (!leader) {
            throw new NotFoundError("Leader not found");
        }

        const alreadyExists = await fieldServiceScheduleRepository.findOne({
            where: {
                template: { id: template_id },
                date,
            },
        });

        if (alreadyExists) {
            throw new BadRequestError("Schedule already exists for this date");
        }

        const schedule = fieldServiceScheduleRepository.create({
            template,
            template_id: template.id,
            date,
            leader,
            leader_id: leader.id,
        });

        await fieldServiceScheduleRepository.save(schedule);

        return res.status(201).json(schedule);
    }

    async generateByPeriod(
        req: CustomRequestPT<
            { template_id: string },
            { startDate: string; endDate: string, mode: "append" | "reconcile" }
        >,
        res: Response
    ) {
        const { template_id } = req.params;
        const { startDate, endDate, mode } = req.body;

        if (!startDate || !endDate) {
            throw new BadRequestError("startDate and endDate are required");
        }

        await generateFieldServiceSchedules({
            template_id,
            startDate,
            endDate,
            mode,
        });

        return res.status(201).send();
    }

    async pdf(req: Request, res: Response) {
        const { congregation_id } = req.params
        const { start, end } = req.query

        if (!start || !end) {
            throw new BadRequestError("start e end são obrigatórios")
        }

        const startDate = new Date(String(start))
        const endDate = new Date(String(end))

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new BadRequestError("Datas inválidas")
        }

        const data = await buildFieldServicePdfData(
            congregation_id,
            startDate,
            endDate
        )

        return res.json(data)
    }

    async getAllFutureSchedules(req: Request, res: Response) {
        const { congregation_id } = req.params;

        // Define o período: de hoje até daqui a 6 meses
        const startDate = dayjs().startOf('day').toDate();
        const endDate = dayjs().add(6, 'months').endOf('month').toDate();

        const data = await buildFieldServicePdfData(
            congregation_id,
            startDate,
            endDate
        );

        return res.json(data);
    }

    async getOne(
        req: ParamsCustomRequest<ParamsGetOneFieldServiceSchedule>,
        res: Response
    ) {
        const { schedule_id } = req.params;

        const schedule = await fieldServiceScheduleRepository.findOne({
            where: { id: schedule_id },
            relations: ["leader", "template"],
        });

        if (!schedule) {
            throw new NotFoundError("Field service schedule not found");
        }

        return res.json(schedule);
    }

    async getByTemplate(
        req: ParamsCustomRequest<ParamsGetSchedulesByTemplate>,
        res: Response
    ) {
        const { template_id } = req.params;

        const schedules = await fieldServiceScheduleRepository.find({
            where: { template: { id: template_id } },
            relations: ["leader"],
            order: { date: "ASC" },
        });

        return res.json(schedules);
    }

    async update(
        req: CustomRequestPT<
            ParamsUpdateFieldServiceSchedule,
            BodyUpdateFieldServiceSchedule
        >,
        res: Response
    ) {
        const { schedule_id } = req.params;
        const data = req.body;

        const schedule = await fieldServiceScheduleRepository.findOne({
            where: { id: schedule_id },
        });

        if (!schedule) {
            throw new NotFoundError("Field service schedule not found");
        }

        if (data.leader_id) {
            const leader = await publisherRepository.findOne({
                where: { id: data.leader_id },
            });

            if (!leader) {
                throw new NotFoundError("Leader not found");
            }

            schedule.leader = leader;
            schedule.leader_id = leader.id;
        }

        if (data.date) {
            schedule.date = data.date;
        }

        await fieldServiceScheduleRepository.save(schedule);

        return res.json(schedule);
    }

    async delete(
        req: ParamsCustomRequest<ParamsDeleteFieldServiceSchedule>,
        res: Response
    ) {
        const { schedule_id } = req.params;

        const schedule = await fieldServiceScheduleRepository.findOne({
            where: { id: schedule_id },
        });

        if (!schedule) {
            throw new NotFoundError("Field service schedule not found");
        }

        await fieldServiceScheduleRepository.remove(schedule);

        return res.status(204).send();
    }
}

export default new FieldServiceScheduleController();
