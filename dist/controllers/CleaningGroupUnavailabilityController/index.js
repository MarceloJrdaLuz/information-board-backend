"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const api_errors_1 = require("../../helpers/api-errors");
const permissions_1 = require("../../middlewares/permissions");
const cleaningGroupRepository_1 = require("../../repositories/cleaningGroupRepository");
const cleaningGroupUnavailabilityRepository_1 = require("../../repositories/cleaningGroupUnavailabilityRepository");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const userRepository_1 = require("../../repositories/userRepository");
class CleaningGroupUnavailabilityController {
    async create(req, res) {
        const { congregation_id } = req.params;
        const { group_id, startDate, endDate, reason } = req.body;
        if (!group_id || !startDate || !endDate) {
            throw new api_errors_1.BadRequestError("group_id, startDate e endDate são obrigatórios.");
        }
        const start = (0, dayjs_1.default)(startDate);
        const end = (0, dayjs_1.default)(endDate);
        if (!start.isValid() || !end.isValid()) {
            throw new api_errors_1.BadRequestError("Formato de data inválido. Use YYYY-MM-DD.");
        }
        if (end.isBefore(start)) {
            throw new api_errors_1.BadRequestError("A data final não pode ser anterior à data inicial.");
        }
        const congregation = await congregationRepository_1.congregationRepository.findOne({
            where: { id: congregation_id }
        });
        if (!congregation) {
            throw new api_errors_1.NotFoundError("Congregação não encontrada.");
        }
        const group = await cleaningGroupRepository_1.cleaningGroupRepository.findOne({
            where: { id: group_id, congregation: { id: congregation_id } }
        });
        if (!group) {
            throw new api_errors_1.NotFoundError("Grupo de limpeza não encontrado nesta congregação.");
        }
        const unavailability = cleaningGroupUnavailabilityRepository_1.cleaningGroupUnavailabilityRepository.create({
            congregation_id,
            congregation,
            group_id,
            group,
            startDate: start.format("YYYY-MM-DD"),
            endDate: end.format("YYYY-MM-DD"),
            reason: reason || null
        });
        await cleaningGroupUnavailabilityRepository_1.cleaningGroupUnavailabilityRepository.save(unavailability);
        return res.status(201).json(unavailability);
    }
    async getByCongregation(req, res) {
        const { congregation_id } = req.params;
        const unavailabilities = await cleaningGroupUnavailabilityRepository_1.cleaningGroupUnavailabilityRepository.find({
            where: { congregation_id },
            relations: ["group"],
            order: { startDate: "ASC" }
        });
        return res.status(200).json(unavailabilities);
    }
    async delete(req, res) {
        var _a;
        const { id } = req.params;
        const unavailability = await cleaningGroupUnavailabilityRepository_1.cleaningGroupUnavailabilityRepository.findOne({
            where: { id },
            relations: ["congregation"]
        });
        if (!unavailability) {
            throw new api_errors_1.NotFoundError("Indisponibilidade de grupo não encontrada.");
        }
        const user = await (0, permissions_1.decoder)(req);
        const userRoles = (_a = user === null || user === void 0 ? void 0 : user.roles) === null || _a === void 0 ? void 0 : _a.map(role => role.name);
        if (!(userRoles === null || userRoles === void 0 ? void 0 : userRoles.includes("ADMIN"))) {
            const userCongregation = await userRepository_1.userRepository.find({
                where: {
                    id: user.id,
                    congregation: { id: unavailability.congregation_id }
                }
            });
            if (userCongregation.length < 1) {
                throw new api_errors_1.UnauthorizedError("Usuário não tem permissão nesta congregação.");
            }
        }
        await cleaningGroupUnavailabilityRepository_1.cleaningGroupUnavailabilityRepository.delete(id);
        return res.status(204).send();
    }
}
exports.default = new CleaningGroupUnavailabilityController();
