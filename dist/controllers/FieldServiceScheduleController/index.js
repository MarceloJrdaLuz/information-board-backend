"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const fieldServiceScheduleRepository_1 = require("../../repositories/fieldServiceScheduleRepository");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const fieldServiceTemplateRepository_1 = require("../../repositories/fieldServiceTemplateRepository");
const generateFieldServiceSchedules_1 = require("../../services/fieldService/generateFieldServiceSchedules");
const buildFieldServicePdfData_1 = require("../../services/fieldService/buildFieldServicePdfData");
const dayjs_1 = __importDefault(require("dayjs"));
class FieldServiceScheduleController {
    async create(req, res) {
        const { template_id } = req.params;
        const { date, leader_id } = req.body;
        if (!date || !leader_id) {
            throw new api_errors_1.BadRequestError("date and leader_id are required");
        }
        const template = await fieldServiceTemplateRepository_1.fieldServiceTemplateRepository.findOne({
            where: { id: template_id },
        });
        if (!template) {
            throw new api_errors_1.NotFoundError("Field service template not found");
        }
        const leader = await publisherRepository_1.publisherRepository.findOne({
            where: { id: leader_id },
        });
        if (!leader) {
            throw new api_errors_1.NotFoundError("Leader not found");
        }
        const alreadyExists = await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.findOne({
            where: {
                template: { id: template_id },
                date,
            },
        });
        if (alreadyExists) {
            throw new api_errors_1.BadRequestError("Schedule already exists for this date");
        }
        const schedule = fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.create({
            template,
            template_id: template.id,
            date,
            leader,
            leader_id: leader.id,
        });
        await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.save(schedule);
        return res.status(201).json(schedule);
    }
    async generateByPeriod(req, res) {
        const { template_id } = req.params;
        const { startDate, endDate, mode } = req.body;
        if (!startDate || !endDate) {
            throw new api_errors_1.BadRequestError("startDate and endDate are required");
        }
        await (0, generateFieldServiceSchedules_1.generateFieldServiceSchedules)({
            template_id,
            startDate,
            endDate,
            mode,
        });
        return res.status(201).send();
    }
    async pdf(req, res) {
        const { congregation_id } = req.params;
        const { start, end } = req.query;
        if (!start || !end) {
            throw new api_errors_1.BadRequestError("start e end são obrigatórios");
        }
        const startDate = new Date(String(start));
        const endDate = new Date(String(end));
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new api_errors_1.BadRequestError("Datas inválidas");
        }
        const data = await (0, buildFieldServicePdfData_1.buildFieldServicePdfData)(congregation_id, startDate, endDate);
        return res.json(data);
    }
    async getAllFutureSchedules(req, res) {
        const { congregation_id } = req.params;
        // Define o período: de hoje até daqui a 6 meses
        const startDate = (0, dayjs_1.default)().startOf('day').toDate();
        const endDate = (0, dayjs_1.default)().add(6, 'months').endOf('month').toDate();
        const data = await (0, buildFieldServicePdfData_1.buildFieldServicePdfData)(congregation_id, startDate, endDate);
        return res.json(data);
    }
    async getOne(req, res) {
        const { schedule_id } = req.params;
        const schedule = await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.findOne({
            where: { id: schedule_id },
            relations: ["leader", "template"],
        });
        if (!schedule) {
            throw new api_errors_1.NotFoundError("Field service schedule not found");
        }
        return res.json(schedule);
    }
    async getByTemplate(req, res) {
        const { template_id } = req.params;
        const schedules = await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.find({
            where: { template: { id: template_id } },
            relations: ["leader"],
            order: { date: "ASC" },
        });
        return res.json(schedules);
    }
    async update(req, res) {
        const { schedule_id } = req.params;
        const data = req.body;
        const schedule = await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.findOne({
            where: { id: schedule_id },
        });
        if (!schedule) {
            throw new api_errors_1.NotFoundError("Field service schedule not found");
        }
        if (data.leader_id) {
            const leader = await publisherRepository_1.publisherRepository.findOne({
                where: { id: data.leader_id },
            });
            if (!leader) {
                throw new api_errors_1.NotFoundError("Leader not found");
            }
            schedule.leader = leader;
            schedule.leader_id = leader.id;
        }
        if (data.date) {
            schedule.date = data.date;
        }
        await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.save(schedule);
        return res.json(schedule);
    }
    async delete(req, res) {
        const { schedule_id } = req.params;
        const schedule = await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.findOne({
            where: { id: schedule_id },
        });
        if (!schedule) {
            throw new api_errors_1.NotFoundError("Field service schedule not found");
        }
        await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.remove(schedule);
        return res.status(204).send();
    }
}
exports.default = new FieldServiceScheduleController();
