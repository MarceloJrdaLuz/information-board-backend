import { Response } from "express";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest";
import { congregationRepository } from "../../repositories/congregationRepository";
import { fieldServiceExceptionRepository } from "../../repositories/fieldServiceExceptionRepository";
import { fieldServiceTemplateRepository } from "../../repositories/fieldServiceTemplateRepository";
import {
    BodyCreateFieldServiceException,
    BodyUpdateFieldServiceException,
    ParamsCreateFieldServiceException,
    ParamsDeleteFieldServiceException,
    ParamsGetFieldServiceExceptionsByCongregation,
    ParamsGetOneFieldServiceException,
    ParamsUpdateFieldServiceException,
} from "./types";
import { IsNull } from "typeorm";

class FieldServiceExceptionController {
    async create(
        req: CustomRequestPT<
            ParamsCreateFieldServiceException,
            BodyCreateFieldServiceException
        >,
        res: Response
    ) {
        const { congregation_id } = req.params;
        const { date, template_id, reason } = req.body;

        if (!date) {
            throw new BadRequestError("date is required");
        }

        const congregation = await congregationRepository.findOne({
            where: { id: congregation_id },
        });

        if (!congregation) {
            throw new NotFoundError("Congregation not found");
        }

        let template = null;

        if (template_id) {
            template = await fieldServiceTemplateRepository.findOne({
                where: {
                    id: template_id,
                    congregation: { id: congregation_id },
                },
            });

            if (!template) {
                throw new NotFoundError("Field service template not found");
            }
        }

        const alreadyExists = await fieldServiceExceptionRepository.findOne({
            where: template
                ? {
                    date,
                    template: { id: template.id },
                }
                : {
                    date,
                    template: IsNull(),
                },
        });


        if (alreadyExists) {
            throw new BadRequestError("Field service exception already exists");
        }

        const exception = fieldServiceExceptionRepository.create({
            date,
            reason,
            congregation,
            congregation_id,
            template_id: template?.id,
        });

        await fieldServiceExceptionRepository.save(exception);

        return res.status(201).json(exception);
    }

    async getOne(
        req: ParamsCustomRequest<ParamsGetOneFieldServiceException>,
        res: Response
    ) {
        const { exception_id } = req.params;

        const exception = await fieldServiceExceptionRepository.findOne({
            where: { id: exception_id },
            relations: ["template"],
        });

        if (!exception) {
            throw new NotFoundError("Field service exception not found");
        }

        return res.json(exception);
    }

    async getByCongregation(
        req: ParamsCustomRequest<ParamsGetFieldServiceExceptionsByCongregation>,
        res: Response
    ) {
        const { congregation_id } = req.params;

        const exceptions = await fieldServiceExceptionRepository.find({
            where: {
                congregation: { id: congregation_id },
            },
            order: { date: "ASC" },
        });

        return res.json(exceptions);
    }

    async update(
        req: CustomRequestPT<
            ParamsUpdateFieldServiceException,
            BodyUpdateFieldServiceException
        >,
        res: Response
    ) {
        const { exception_id } = req.params;
        const data = req.body;

        const exception = await fieldServiceExceptionRepository.findOne({
            where: { id: exception_id },
        });

        if (!exception) {
            throw new NotFoundError("Field service exception not found");
        }

        if (data.template_id !== undefined) {
            if (data.template_id === null) {
                exception.template = undefined;
                exception.template_id = undefined;
            } else {
                const template = await fieldServiceTemplateRepository.findOne({
                    where: { id: data.template_id },
                });

                if (!template) {
                    throw new NotFoundError("Field service template not found");
                }

                exception.template = template;
                exception.template_id = template.id;
            }
        }

        if (data.date) exception.date = data.date;
        if (data.reason !== undefined) exception.reason = data.reason || undefined;

        await fieldServiceExceptionRepository.save(exception);

        return res.json(exception);
    }

    async delete(
        req: ParamsCustomRequest<ParamsDeleteFieldServiceException>,
        res: Response
    ) {
        const { exception_id } = req.params;

        const exception = await fieldServiceExceptionRepository.findOne({
            where: { id: exception_id },
        });

        if (!exception) {
            throw new NotFoundError("Field service exception not found");
        }

        await fieldServiceExceptionRepository.remove(exception);

        return res.status(204).send();
    }
}

export default new FieldServiceExceptionController();
