"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const cleaningScheduleConfigRepository_1 = require("../../repositories/cleaningScheduleConfigRepository");
class CleaningScheduleConfigController {
    // Criar configuração
    async create(req, res) {
        const { congregation_id } = req.params;
        const { mode } = req.body;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation) {
            throw new api_errors_1.BadRequestError(messageErrors_1.messageErrors.notFound.congregation);
        }
        const configExists = await cleaningScheduleConfigRepository_1.cleaningScheduleConfigRepository.findOne({
            where: { congregation: { id: congregation.id } }
        });
        if (configExists) {
            throw new api_errors_1.BadRequestError("Configuration already exists for this congregation");
        }
        const config = cleaningScheduleConfigRepository_1.cleaningScheduleConfigRepository.create({
            congregation,
            mode,
        });
        await cleaningScheduleConfigRepository_1.cleaningScheduleConfigRepository.save(config)
            .then(() => res.status(201).json(config))
            .catch(err => {
            console.log(err);
            res.status(500).send({ message: "Internal server error" });
        });
    }
    // Atualizar configuração
    async update(req, res) {
        const { config_id: id } = req.params;
        const { mode } = req.body;
        const config = await cleaningScheduleConfigRepository_1.cleaningScheduleConfigRepository.findOneBy({ id });
        if (!config) {
            throw new api_errors_1.NotFoundError("Cleaning schedule configuration not found");
        }
        config.mode = mode !== null && mode !== void 0 ? mode : config.mode;
        await cleaningScheduleConfigRepository_1.cleaningScheduleConfigRepository.save(config)
            .then(result => res.status(200).json(result))
            .catch(err => {
            console.log(err);
            res.status(500).json({ message: "Internal server error" });
        });
    }
    // Buscar uma configuração específica
    async getOne(req, res) {
        const { config_id: id } = req.params;
        const config = await cleaningScheduleConfigRepository_1.cleaningScheduleConfigRepository.findOne({
            where: { id },
            relations: ["congregation"]
        });
        if (!config) {
            throw new api_errors_1.NotFoundError("Cleaning schedule configuration not found");
        }
        return res.status(200).json(config);
    }
    // Buscar a configuração de uma congregação
    async getByCongregation(req, res) {
        const { congregation_id } = req.params;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        }
        const config = await cleaningScheduleConfigRepository_1.cleaningScheduleConfigRepository.findOne({
            where: { congregation: { id: congregation.id } },
            relations: ["congregation"]
        });
        if (!config) {
            throw new api_errors_1.NotFoundError("Configuration not found for this congregation");
        }
        return res.status(200).json(config);
    }
    // Deletar configuração
    async delete(req, res) {
        const { config_id } = req.params;
        const config = await cleaningScheduleConfigRepository_1.cleaningScheduleConfigRepository.findOneBy({ id: config_id });
        if (!config) {
            throw new api_errors_1.NotFoundError("Cleaning schedule configuration not found");
        }
        await cleaningScheduleConfigRepository_1.cleaningScheduleConfigRepository.remove(config).catch(err => console.log(err));
        return res.status(200).end();
    }
}
exports.default = new CleaningScheduleConfigController();
