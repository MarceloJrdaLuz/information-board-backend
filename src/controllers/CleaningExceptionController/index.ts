import { Response } from "express";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { cleaningExceptionRepository } from "../../repositories/cleaningExceptionRepository";
import { congregationRepository } from "../../repositories/congregationRepository";
import { CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest";
import {
    BodyCreateCleaningException,
    ParamsCreateCleaningException,
    ParamsDeleteCleaningException,
    ParamsGetCleaningExceptionByCongregation,
    ParamsGetOneCleaningException,
    ParamsUpdateCleaningException
} from "./types";

class CleaningExceptionController {
    async create(req: CustomRequestPT<ParamsCreateCleaningException, BodyCreateCleaningException>, res: Response) {
        const { congregation_id } = req.params;
        const { date, reason } = req.body

        if (!date) {
            throw new BadRequestError("date is required");
        }

        const congregation = await congregationRepository.findOne({
            where: { id: congregation_id }
        });

        if (!congregation) {
            throw new NotFoundError("Congregation not found");
        }

        const alreadyExists = await cleaningExceptionRepository.findOne({
            where: {
                date,
                congregation: { id: congregation_id }
            }
        });

        if (alreadyExists) {
            throw new BadRequestError("Exception cleaning already exists");
        }


        const exception = cleaningExceptionRepository.create({
            date,
            reason,
            congregation
        });

        await cleaningExceptionRepository.save(exception);

        return res.status(201).json(exception);
    }

    async getOne(req: ParamsCustomRequest<ParamsGetOneCleaningException>, res: Response) {
        const { exception_id } = req.params;

        const exception = await cleaningExceptionRepository.findOne({
            where: { id: exception_id },
            relations: ["congregation"]
        });

        if (!exception) {
            throw new NotFoundError("Cleaning exception not found");
        }

        return res.json(exception);
    }

    async getByCongregation(req: ParamsCustomRequest<ParamsGetCleaningExceptionByCongregation>, res: Response) {
        const { congregation_id } = req.params;

        const list = await cleaningExceptionRepository.find({
            where: { congregation: { id: congregation_id } },
            order: { date: "ASC" }
        });

        return res.json(list);
    }

    async update(req: ParamsCustomRequest<ParamsUpdateCleaningException>, res: Response) {
        const { exception_id } = req.params;
        const data = req.body

        const exception = await cleaningExceptionRepository.findOne({ where: { id: exception_id } });

        if (!exception) {
            throw new NotFoundError("Cleaning exception not found");
        }

        Object.assign(exception, data);

        await cleaningExceptionRepository.save(exception);

        return res.json(exception);
    }

    async delete(req: ParamsCustomRequest<ParamsDeleteCleaningException>, res: Response) {
        const { exception_id } = req.params;

        const exception = await cleaningExceptionRepository.findOne({ where: { id: exception_id } });

        if (!exception) {
            throw new NotFoundError("Cleaning exception not found");
        }

        await cleaningExceptionRepository.remove(exception);

        return res.status(204).send();
    }
}

export default new CleaningExceptionController();
