"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const cleaningExceptionRepository_1 = require("../../repositories/cleaningExceptionRepository");
const congregationRepository_1 = require("../../repositories/congregationRepository");
class CleaningExceptionController {
    async create(req, res) {
        const { congregation_id } = req.params;
        const { date, reason } = req.body;
        if (!date) {
            throw new api_errors_1.BadRequestError("date is required");
        }
        const congregation = await congregationRepository_1.congregationRepository.findOne({
            where: { id: congregation_id }
        });
        if (!congregation) {
            throw new api_errors_1.NotFoundError("Congregation not found");
        }
        const alreadyExists = await cleaningExceptionRepository_1.cleaningExceptionRepository.findOne({
            where: {
                date,
                congregation: { id: congregation_id }
            }
        });
        if (alreadyExists) {
            throw new api_errors_1.BadRequestError("Exception cleaning already exists");
        }
        const exception = cleaningExceptionRepository_1.cleaningExceptionRepository.create({
            date,
            reason,
            congregation
        });
        await cleaningExceptionRepository_1.cleaningExceptionRepository.save(exception);
        return res.status(201).json(exception);
    }
    async getOne(req, res) {
        const { exception_id } = req.params;
        const exception = await cleaningExceptionRepository_1.cleaningExceptionRepository.findOne({
            where: { id: exception_id },
            relations: ["congregation"]
        });
        if (!exception) {
            throw new api_errors_1.NotFoundError("Cleaning exception not found");
        }
        return res.json(exception);
    }
    async getByCongregation(req, res) {
        const { congregation_id } = req.params;
        const list = await cleaningExceptionRepository_1.cleaningExceptionRepository.find({
            where: { congregation: { id: congregation_id } },
            order: { date: "ASC" }
        });
        return res.json(list);
    }
    async update(req, res) {
        const { exception_id } = req.params;
        const data = req.body;
        const exception = await cleaningExceptionRepository_1.cleaningExceptionRepository.findOne({ where: { id: exception_id } });
        if (!exception) {
            throw new api_errors_1.NotFoundError("Cleaning exception not found");
        }
        Object.assign(exception, data);
        await cleaningExceptionRepository_1.cleaningExceptionRepository.save(exception);
        return res.json(exception);
    }
    async delete(req, res) {
        const { exception_id } = req.params;
        const exception = await cleaningExceptionRepository_1.cleaningExceptionRepository.findOne({ where: { id: exception_id } });
        if (!exception) {
            throw new api_errors_1.NotFoundError("Cleaning exception not found");
        }
        await cleaningExceptionRepository_1.cleaningExceptionRepository.remove(exception);
        return res.status(204).send();
    }
}
exports.default = new CleaningExceptionController();
