"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const fieldServiceExceptionRepository_1 = require("../../repositories/fieldServiceExceptionRepository");
const fieldServiceTemplateRepository_1 = require("../../repositories/fieldServiceTemplateRepository");
const typeorm_1 = require("typeorm");
class FieldServiceExceptionController {
    async create(req, res) {
        const { congregation_id } = req.params;
        const { date, template_id, reason } = req.body;
        if (!date) {
            throw new api_errors_1.BadRequestError("date is required");
        }
        const congregation = await congregationRepository_1.congregationRepository.findOne({
            where: { id: congregation_id },
        });
        if (!congregation) {
            throw new api_errors_1.NotFoundError("Congregation not found");
        }
        let template = null;
        if (template_id) {
            template = await fieldServiceTemplateRepository_1.fieldServiceTemplateRepository.findOne({
                where: {
                    id: template_id,
                    congregation: { id: congregation_id },
                },
            });
            if (!template) {
                throw new api_errors_1.NotFoundError("Field service template not found");
            }
        }
        const alreadyExists = await fieldServiceExceptionRepository_1.fieldServiceExceptionRepository.findOne({
            where: template
                ? {
                    date,
                    template: { id: template.id },
                }
                : {
                    date,
                    template: (0, typeorm_1.IsNull)(),
                },
        });
        if (alreadyExists) {
            throw new api_errors_1.BadRequestError("Field service exception already exists");
        }
        const exception = fieldServiceExceptionRepository_1.fieldServiceExceptionRepository.create({
            date,
            reason,
            congregation,
            congregation_id,
            template_id: template === null || template === void 0 ? void 0 : template.id,
        });
        await fieldServiceExceptionRepository_1.fieldServiceExceptionRepository.save(exception);
        return res.status(201).json(exception);
    }
    async getOne(req, res) {
        const { exception_id } = req.params;
        const exception = await fieldServiceExceptionRepository_1.fieldServiceExceptionRepository.findOne({
            where: { id: exception_id },
            relations: ["template"],
        });
        if (!exception) {
            throw new api_errors_1.NotFoundError("Field service exception not found");
        }
        return res.json(exception);
    }
    async getByCongregation(req, res) {
        const { congregation_id } = req.params;
        const exceptions = await fieldServiceExceptionRepository_1.fieldServiceExceptionRepository.find({
            where: {
                congregation: { id: congregation_id },
            },
            order: { date: "ASC" },
        });
        return res.json(exceptions);
    }
    async update(req, res) {
        const { exception_id } = req.params;
        const data = req.body;
        const exception = await fieldServiceExceptionRepository_1.fieldServiceExceptionRepository.findOne({
            where: { id: exception_id },
        });
        if (!exception) {
            throw new api_errors_1.NotFoundError("Field service exception not found");
        }
        if (data.template_id !== undefined) {
            if (data.template_id === null) {
                exception.template = undefined;
                exception.template_id = undefined;
            }
            else {
                const template = await fieldServiceTemplateRepository_1.fieldServiceTemplateRepository.findOne({
                    where: { id: data.template_id },
                });
                if (!template) {
                    throw new api_errors_1.NotFoundError("Field service template not found");
                }
                exception.template = template;
                exception.template_id = template.id;
            }
        }
        if (data.date)
            exception.date = data.date;
        if (data.reason !== undefined)
            exception.reason = data.reason || undefined;
        await fieldServiceExceptionRepository_1.fieldServiceExceptionRepository.save(exception);
        return res.json(exception);
    }
    async delete(req, res) {
        const { exception_id } = req.params;
        const exception = await fieldServiceExceptionRepository_1.fieldServiceExceptionRepository.findOne({
            where: { id: exception_id },
        });
        if (!exception) {
            throw new api_errors_1.NotFoundError("Field service exception not found");
        }
        await fieldServiceExceptionRepository_1.fieldServiceExceptionRepository.remove(exception);
        return res.status(204).send();
    }
}
exports.default = new FieldServiceExceptionController();
