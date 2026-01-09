"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const fieldServiceTemplateRepository_1 = require("../../repositories/fieldServiceTemplateRepository");
const fieldServiceRotationMembersRepository_1 = require("../../repositories/fieldServiceRotationMembersRepository");
const dayjs_1 = __importDefault(require("dayjs"));
class FieldServiceTemplateController {
    /* =====================
       CREATE
    ===================== */
    async create(req, res) {
        var _a;
        const { congregation_id } = req.params;
        const { weekday, location, time, type, leader_id, rotation_members } = req.body;
        if (weekday === undefined ||
            !location ||
            !time ||
            !type) {
            throw new api_errors_1.BadRequestError("Missing required fields");
        }
        const congregation = await congregationRepository_1.congregationRepository.findOne({
            where: { id: congregation_id },
        });
        if (!congregation) {
            throw new api_errors_1.NotFoundError("Congregation not found");
        }
        /* =====================
           Regras de negócio
        ===================== */
        if (type === "FIXED" && !leader_id) {
            throw new api_errors_1.BadRequestError("FIXED service requires leader");
        }
        if (type === "ROTATION" && leader_id) {
            throw new api_errors_1.BadRequestError("ROTATION service cannot have leader");
        }
        let leader = null;
        if (leader_id) {
            leader = await publisherRepository_1.publisherRepository.findOne({
                where: { id: leader_id },
            });
            if (!leader) {
                throw new api_errors_1.NotFoundError("Leader not found");
            }
        }
        const template = fieldServiceTemplateRepository_1.fieldServiceTemplateRepository.create({
            congregation,
            congregation_id,
            weekday,
            location,
            time,
            type,
            leader,
            leader_id: (_a = leader === null || leader === void 0 ? void 0 : leader.id) !== null && _a !== void 0 ? _a : null,
            active: true,
        });
        await fieldServiceTemplateRepository_1.fieldServiceTemplateRepository.save(template);
        /* =====================
           Rodízio
        ===================== */
        if (type === "ROTATION" && (rotation_members === null || rotation_members === void 0 ? void 0 : rotation_members.length)) {
            const members = rotation_members.map((publisher_id, index) => fieldServiceRotationMembersRepository_1.fieldServiceRotationMemberRepository.create({
                template,
                publisher_id,
                order: index,
            }));
            await fieldServiceRotationMembersRepository_1.fieldServiceRotationMemberRepository.save(members);
        }
        return res.status(201).json(template);
    }
    /* =====================
       GET ONE
    ===================== */
    async getOne(req, res) {
        var _a;
        const { template_id } = req.params;
        const template = await fieldServiceTemplateRepository_1.fieldServiceTemplateRepository.findOne({
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
            throw new api_errors_1.NotFoundError("Field service template not found");
        }
        const overrides = (_a = template.location_overrides) !== null && _a !== void 0 ? _a : [];
        return res.json({
            ...template,
            location_rotation: overrides.length > 0,
            location_overrides: overrides.map(o => ({
                week_start: o.week_start,
                // 👇 data real da saída (mesmo weekday do template)
                date: (0, dayjs_1.default)(o.week_start)
                    .isoWeekday(template.weekday + 1) // weekday JS → ISO
                    .format("YYYY-MM-DD"),
                location: o.location,
            })),
        });
    }
    /* =====================
       GET BY CONGREGATION
    ===================== */
    async getByCongregation(req, res) {
        const { congregation_id } = req.params;
        const templates = await fieldServiceTemplateRepository_1.fieldServiceTemplateRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["leader"],
            order: { weekday: "ASC", time: "ASC" },
        });
        return res.json(templates);
    }
    /* =====================
       UPDATE
    ===================== */
    async update(req, res) {
        const { template_id } = req.params;
        const data = req.body;
        const template = await fieldServiceTemplateRepository_1.fieldServiceTemplateRepository.findOne({
            where: { id: template_id },
        });
        if (!template) {
            throw new api_errors_1.NotFoundError("Field service template not found");
        }
        Object.assign(template, data);
        await fieldServiceTemplateRepository_1.fieldServiceTemplateRepository.save(template);
        if (data.rotation_members) {
            await fieldServiceRotationMembersRepository_1.fieldServiceRotationMemberRepository.delete({
                template: { id: template.id },
            });
            const members = data.rotation_members.map((publisher_id, index) => fieldServiceRotationMembersRepository_1.fieldServiceRotationMemberRepository.create({
                template,
                publisher_id,
                order: index,
            }));
            await fieldServiceRotationMembersRepository_1.fieldServiceRotationMemberRepository.save(members);
        }
        return res.json(template);
    }
    /* =====================
       DELETE
    ===================== */
    async delete(req, res) {
        const { template_id } = req.params;
        const template = await fieldServiceTemplateRepository_1.fieldServiceTemplateRepository.findOne({
            where: { id: template_id },
        });
        if (!template) {
            throw new api_errors_1.NotFoundError("Field service template not found");
        }
        await fieldServiceTemplateRepository_1.fieldServiceTemplateRepository.remove(template);
        return res.status(204).send();
    }
}
exports.default = new FieldServiceTemplateController();
