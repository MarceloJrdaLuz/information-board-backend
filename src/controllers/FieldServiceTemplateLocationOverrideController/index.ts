import { Response } from "express";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { fieldServiceTemplateRepository } from "../../repositories/fieldServiceTemplateRepository";
import { fieldServiceTemplateLocationOverrideRepository } from "../../repositories/fieldServiceTemplateLocationOverrideRepository";
import { CustomRequestPT } from "../../types/customRequest";
import {
    ParamsUpsertTemplateLocations,
    BodyUpsertTemplateLocations,
} from "./types";

dayjs.extend(isoWeek);

class FieldServiceTemplateLocationOverrideController {
    /* =====================
       UPSERT (mês / semanas)
    ===================== */
    async upsert(
        req: CustomRequestPT<
            ParamsUpsertTemplateLocations,
            BodyUpsertTemplateLocations
        >,
        res: Response
    ) {
        const { template_id } = req.params
        const { weeks, clear_all } = req.body

        const template = await fieldServiceTemplateRepository.findOne({
            where: { id: template_id },
        })

        if (!template) {
            throw new NotFoundError("Field service template not found")
        }

        /* =====================
           LIMPAR TUDO
        ===================== */
        if (clear_all === true) {
            await fieldServiceTemplateLocationOverrideRepository.delete({
                template_id,
            })

            return res.status(200).json({
                success: true,
                message: "All weekly locations were removed",
            })
        }

        /* =====================
           VALIDAÇÃO
        ===================== */
        if (!weeks?.length) {
            throw new BadRequestError(
                "Weeks array is required or use clear_all=true to remove all"
            )
        }

        /* =====================
           UPSERT
        ===================== */
        for (const week of weeks) {
            if (!week.date || !week.location) {
                throw new BadRequestError("Each week must have date and location")
            }

            const weekStart = dayjs(week.date)
                .startOf("isoWeek")
                .format("YYYY-MM-DD")

            await fieldServiceTemplateLocationOverrideRepository.upsert(
                {
                    template_id,
                    week_start: weekStart,
                    location: week.location,
                },
                ["template_id", "week_start"]
            )
        }

        return res.status(200).json({
            success: true,
            message: "Weekly locations saved successfully",
        })
    }
}

export default new FieldServiceTemplateLocationOverrideController();
