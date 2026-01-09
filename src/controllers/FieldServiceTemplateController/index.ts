import { Response } from "express";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { congregationRepository } from "../../repositories/congregationRepository";
import { publisherRepository } from "../../repositories/publisherRepository";
import { fieldServiceTemplateRepository } from "../../repositories/fieldServiceTemplateRepository";
import { CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest";
import {
    BodyCreateFieldServiceTemplate,
    ParamsCreateFieldServiceTemplate,
    ParamsGetFieldServiceTemplatesByCongregation,
    ParamsGetOneFieldServiceTemplate,
    ParamsUpdateFieldServiceTemplate,
    ParamsDeleteFieldServiceTemplate,
    BodyUpdateFieldServiceTemplate,
} from "./types";
import { fieldServiceRotationMemberRepository } from "../../repositories/fieldServiceRotationMembersRepository";
import dayjs from "dayjs";

class FieldServiceTemplateController {
    /* =====================
       CREATE
    ===================== */
    async create(
        req: CustomRequestPT<
            ParamsCreateFieldServiceTemplate,
            BodyCreateFieldServiceTemplate
        >,
        res: Response
    ) {
        const { congregation_id } = req.params;
        const { weekday, location, time, type, leader_id, rotation_members } =
            req.body;

        if (
            weekday === undefined ||
            !location ||
            !time ||
            !type
        ) {
            throw new BadRequestError("Missing required fields");
        }

        const congregation = await congregationRepository.findOne({
            where: { id: congregation_id },
        });

        if (!congregation) {
            throw new NotFoundError("Congregation not found");
        }

        /* =====================
           Regras de negócio
        ===================== */
        if (type === "FIXED" && !leader_id) {
            throw new BadRequestError("FIXED service requires leader");
        }

        if (type === "ROTATION" && leader_id) {
            throw new BadRequestError("ROTATION service cannot have leader");
        }

        let leader = null;

        if (leader_id) {
            leader = await publisherRepository.findOne({
                where: { id: leader_id },
            });

            if (!leader) {
                throw new NotFoundError("Leader not found");
            }
        }

        const template = fieldServiceTemplateRepository.create({
            congregation,
            congregation_id,
            weekday,
            location,
            time,
            type,
            leader,
            leader_id: leader?.id ?? null,
            active: true,
        });

        await fieldServiceTemplateRepository.save(template);

        /* =====================
           Rodízio
        ===================== */
        if (type === "ROTATION" && rotation_members?.length) {
            const members = rotation_members.map((publisher_id, index) =>
                fieldServiceRotationMemberRepository.create({
                    template,
                    publisher_id,
                    order: index,
                })
            );

            await fieldServiceRotationMemberRepository.save(members);
        }

        return res.status(201).json(template);
    }

    /* =====================
       GET ONE
    ===================== */
    async getOne(
        req: ParamsCustomRequest<ParamsGetOneFieldServiceTemplate>,
        res: Response
    ) {
        const { template_id } = req.params;

        const template = await fieldServiceTemplateRepository.findOne({
            where: { id: template_id },
            relations: [
                "leader",
                "congregation",
                "rotation_members",
                "rotation_members.publisher",
                "location_overrides"
            ],
            order: {
                location_overrides: {
                    week_start: "ASC",
                },
            },
        });

        if (!template) {
            throw new NotFoundError("Field service template not found");
        }

        const overrides = template.location_overrides ?? [];

        return res.json({
            ...template,
            location_rotation: overrides.length > 0,
            location_overrides: overrides.map(o => ({
                week_start: o.week_start,
                // 👇 data real da saída (mesmo weekday do template)
                date: dayjs(o.week_start)
                    .isoWeekday(template.weekday + 1) // weekday JS → ISO
                    .format("YYYY-MM-DD"),
                location: o.location,
            })),
        });
    }

    /* =====================
       GET BY CONGREGATION
    ===================== */
    async getByCongregation(
        req: ParamsCustomRequest<ParamsGetFieldServiceTemplatesByCongregation>,
        res: Response
    ) {
        const { congregation_id } = req.params;

        const templates = await fieldServiceTemplateRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["leader"],
            order: { weekday: "ASC", time: "ASC" },
        });

        return res.json(templates);
    }

    /* =====================
       UPDATE
    ===================== */
    async update(
        req: CustomRequestPT<ParamsUpdateFieldServiceTemplate, BodyUpdateFieldServiceTemplate>,
        res: Response
    ) {
        const { template_id } = req.params;
        const data = req.body;

        const template = await fieldServiceTemplateRepository.findOne({
            where: { id: template_id },
        });

        if (!template) {
            throw new NotFoundError("Field service template not found");
        }

        Object.assign(template, data);

        await fieldServiceTemplateRepository.save(template);

        if (data.rotation_members) {
            await fieldServiceRotationMemberRepository.delete({
                template: { id: template.id },
            });

            const members = data.rotation_members.map(
                (publisher_id: string, index: number) =>
                    fieldServiceRotationMemberRepository.create({
                        template,
                        publisher_id,
                        order: index,
                    })
            );

            await fieldServiceRotationMemberRepository.save(members);
        }

        return res.json(template);
    }


    /* =====================
       DELETE
    ===================== */
    async delete(
        req: ParamsCustomRequest<ParamsDeleteFieldServiceTemplate>,
        res: Response
    ) {
        const { template_id } = req.params;

        const template = await fieldServiceTemplateRepository.findOne({
            where: { id: template_id },
        });

        if (!template) {
            throw new NotFoundError("Field service template not found");
        }

        await fieldServiceTemplateRepository.remove(template);

        return res.status(204).send();
    }
}

export default new FieldServiceTemplateController();
