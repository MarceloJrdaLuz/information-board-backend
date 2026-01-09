"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const isoWeek_1 = __importDefault(require("dayjs/plugin/isoWeek"));
const api_errors_1 = require("../../helpers/api-errors");
const fieldServiceTemplateRepository_1 = require("../../repositories/fieldServiceTemplateRepository");
const fieldServiceTemplateLocationOverrideRepository_1 = require("../../repositories/fieldServiceTemplateLocationOverrideRepository");
dayjs_1.default.extend(isoWeek_1.default);
class FieldServiceTemplateLocationOverrideController {
    /* =====================
       UPSERT (mês / semanas)
    ===================== */
    async upsert(req, res) {
        const { template_id } = req.params;
        const { weeks, clear_all } = req.body;
        const template = await fieldServiceTemplateRepository_1.fieldServiceTemplateRepository.findOne({
            where: { id: template_id },
        });
        if (!template) {
            throw new api_errors_1.NotFoundError("Field service template not found");
        }
        /* =====================
           LIMPAR TUDO
        ===================== */
        if (clear_all === true) {
            await fieldServiceTemplateLocationOverrideRepository_1.fieldServiceTemplateLocationOverrideRepository.delete({
                template_id,
            });
            return res.status(200).json({
                success: true,
                message: "All weekly locations were removed",
            });
        }
        /* =====================
           VALIDAÇÃO
        ===================== */
        if (!(weeks === null || weeks === void 0 ? void 0 : weeks.length)) {
            throw new api_errors_1.BadRequestError("Weeks array is required or use clear_all=true to remove all");
        }
        /* =====================
           UPSERT
        ===================== */
        for (const week of weeks) {
            if (!week.date || !week.location) {
                throw new api_errors_1.BadRequestError("Each week must have date and location");
            }
            const weekStart = (0, dayjs_1.default)(week.date)
                .startOf("isoWeek")
                .format("YYYY-MM-DD");
            await fieldServiceTemplateLocationOverrideRepository_1.fieldServiceTemplateLocationOverrideRepository.upsert({
                template_id,
                week_start: weekStart,
                location: week.location,
            }, ["template_id", "week_start"]);
        }
        return res.status(200).json({
            success: true,
            message: "Weekly locations saved successfully",
        });
    }
}
exports.default = new FieldServiceTemplateLocationOverrideController();
