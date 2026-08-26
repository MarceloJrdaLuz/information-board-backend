"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const typeorm_1 = require("typeorm");
const Notification_1 = require("../../entities/Notification");
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const externalTalkRepository_1 = require("../../repositories/externalTalkRepository");
const speakerRepository_1 = require("../../repositories/speakerRepository");
const talkRepository_1 = require("../../repositories/talkRepository");
const pushNotificationService_1 = require("../../services/pushNotificationService");
class ExternalTalkController {
    async create(req, res) {
        var _a;
        const { congregation_id } = req.params;
        const { destinationCongregation_id, speaker_id, talk_id, manualTalk, date } = req.body;
        if (!date) {
            throw new api_errors_1.BadRequestError("Date is required");
        }
        const originCongregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!originCongregation) {
            throw new api_errors_1.BadRequestError("Origin Congregation not found");
        }
        // orador é obrigatório
        if (!speaker_id) {
            throw new api_errors_1.BadRequestError("Speaker is required");
        }
        const speaker = await speakerRepository_1.speakerRepository.findOne({
            where: {
                id: speaker_id,
                creatorCongregation: { id: congregation_id },
                originCongregation: { id: congregation_id }
            },
            relations: ["publisher"]
        });
        if (!speaker) {
            throw new api_errors_1.BadRequestError(messageErrors_1.messageErrors.notFound.speaker);
        }
        const destinationCongregation = await congregationRepository_1.congregationRepository.findOne({
            where: {
                id: destinationCongregation_id,
                creatorCongregation: {
                    id: congregation_id
                }
            }
        });
        if (!destinationCongregation) {
            throw new api_errors_1.BadRequestError("Destination Congregation not found");
        }
        // Talk é totalmente opcional
        let talk = null;
        if (talk_id) {
            talk = await talkRepository_1.talkRepository.findOneBy({ id: talk_id });
            if (!talk) {
                throw new api_errors_1.BadRequestError(messageErrors_1.messageErrors.notFound.talk);
            }
        }
        const externalTalk = externalTalkRepository_1.externalTalkRepository.create({
            speaker,
            talk: talk !== null && talk !== void 0 ? talk : null,
            manualTalk: manualTalk !== null && manualTalk !== void 0 ? manualTalk : null,
            destinationCongregation,
            originCongregation,
            date: (0, moment_timezone_1.default)(date).format("YYYY-MM-DD"),
            status: "pending"
        });
        await externalTalkRepository_1.externalTalkRepository.save(externalTalk);
        if ((_a = speaker.publisher) === null || _a === void 0 ? void 0 : _a.id) {
            const dateFmt = (0, moment_timezone_1.default)(externalTalk.date).format("DD/MM/YYYY");
            pushNotificationService_1.pushNotificationService.sendToPublisher(speaker.publisher.id, {
                title: "Designação: Discurso Fora",
                body: `Você foi designado para fazer um discurso fora no dia ${dateFmt} na congregação ${destinationCongregation.name}.`,
                type: Notification_1.NotificationType.SPEAKER,
                data: { url: "/dashboard", date: externalTalk.date }
            }).catch(err => console.error("Erro ao enviar push de discurso fora:", err));
        }
        return res.status(201).json(externalTalk);
    }
    async getExternalTalks(req, res) {
        const { congregation_id } = req.params;
        const externalTalks = await externalTalkRepository_1.externalTalkRepository.find({
            where: { originCongregation: { id: congregation_id } },
            relations: ["speaker", "talk", "destinationCongregation"],
            order: { date: "ASC" }
        });
        return res.json(externalTalks);
    }
    async getExternalTalksByPeriod(req, res) {
        const { congregation_id } = req.params;
        const { start, end } = req.query;
        if (!start || !end) {
            throw new api_errors_1.BadRequestError("Start and end dates are required");
        }
        const startFormatted = (0, moment_timezone_1.default)(start, "YYYY-MM-DD").format("YYYY-MM-DD");
        const endFormatted = (0, moment_timezone_1.default)(end, "YYYY-MM-DD").format("YYYY-MM-DD");
        const externalTalks = await externalTalkRepository_1.externalTalkRepository.find({
            where: {
                originCongregation: { id: congregation_id },
                date: (0, typeorm_1.Between)(startFormatted, endFormatted)
            },
            relations: ["speaker", "talk", "destinationCongregation"],
            order: { date: "ASC" }
        });
        return res.json(externalTalks);
    }
    async update(req, res) {
        var _a, _b, _c, _d, _e;
        const { externalTalk_id: id } = req.params;
        const { speaker_id, destinationCongregation_id, talk_id, manualTalk, status, date } = req.body;
        const externalTalk = await externalTalkRepository_1.externalTalkRepository.findOne({
            where: { id },
            relations: ["speaker", "speaker.publisher", "talk", "destinationCongregation"]
        });
        if (!externalTalk) {
            throw new api_errors_1.BadRequestError(messageErrors_1.messageErrors.notFound.externalTalk);
        }
        const oldSpeakerPubId = (_b = (_a = externalTalk.speaker) === null || _a === void 0 ? void 0 : _a.publisher) === null || _b === void 0 ? void 0 : _b.id;
        // Campos opcionais - só atualiza se enviado
        if (speaker_id) {
            const speaker = await speakerRepository_1.speakerRepository.findOne({
                where: { id: speaker_id },
                relations: ["publisher"]
            });
            if (!speaker)
                throw new api_errors_1.BadRequestError(messageErrors_1.messageErrors.notFound.speaker);
            externalTalk.speaker = speaker;
        }
        if (destinationCongregation_id) {
            const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: destinationCongregation_id });
            if (!congregation)
                throw new api_errors_1.BadRequestError(messageErrors_1.messageErrors.notFound.congregation);
            externalTalk.destinationCongregation = congregation;
        }
        // talk é opcional - pode ser definido, removido ou substituído por manualTalk
        if (talk_id) {
            const talk = await talkRepository_1.talkRepository.findOneBy({ id: talk_id });
            if (!talk)
                throw new api_errors_1.BadRequestError(messageErrors_1.messageErrors.notFound.talk);
            externalTalk.talk = talk;
            externalTalk.manualTalk = null;
        }
        else if (manualTalk !== undefined) {
            externalTalk.manualTalk = manualTalk;
            externalTalk.talk = null;
        }
        if (status) {
            externalTalk.status = status;
        }
        if (date) {
            externalTalk.date = (0, moment_timezone_1.default)(date).format("YYYY-MM-DD");
        }
        await externalTalkRepository_1.externalTalkRepository.save(externalTalk);
        const newSpeakerPubId = (_d = (_c = externalTalk.speaker) === null || _c === void 0 ? void 0 : _c.publisher) === null || _d === void 0 ? void 0 : _d.id;
        const dateFmt = (0, moment_timezone_1.default)(externalTalk.date).format("DD/MM/YYYY");
        if (oldSpeakerPubId !== newSpeakerPubId) {
            if (oldSpeakerPubId) {
                pushNotificationService_1.pushNotificationService.sendToPublisher(oldSpeakerPubId, {
                    title: "Designação Cancelada",
                    body: `Sua designação de discurso fora para o dia ${dateFmt} foi cancelada.`,
                    type: Notification_1.NotificationType.SPEAKER,
                    data: { url: "/dashboard", date: externalTalk.date }
                }).catch(err => console.error("Erro ao enviar push:", err));
            }
            if (newSpeakerPubId) {
                pushNotificationService_1.pushNotificationService.sendToPublisher(newSpeakerPubId, {
                    title: "Designação: Discurso Fora",
                    body: `Você foi designado para fazer um discurso fora no dia ${dateFmt} na congregação ${(_e = externalTalk.destinationCongregation) === null || _e === void 0 ? void 0 : _e.name}.`,
                    type: Notification_1.NotificationType.SPEAKER,
                    data: { url: "/dashboard", date: externalTalk.date }
                }).catch(err => console.error("Erro ao enviar push:", err));
            }
        }
        return res.json(externalTalk);
    }
    async updateStatus(req, res) {
        const { externalTalk_id: id } = req.params;
        const { status } = req.body;
        const externalTalk = await externalTalkRepository_1.externalTalkRepository.findOneBy({ id });
        if (!externalTalk) {
            throw new api_errors_1.BadRequestError("External talk not found");
        }
        if (status) {
            externalTalk.status = status;
        }
        await externalTalkRepository_1.externalTalkRepository.save(externalTalk);
        return res.json(externalTalk);
    }
    async delete(req, res) {
        const { externalTalk_id: id } = req.params;
        const externalTalk = await externalTalkRepository_1.externalTalkRepository.findOneBy({ id });
        if (!externalTalk) {
            throw new api_errors_1.BadRequestError(messageErrors_1.messageErrors.notFound.externalTalk);
        }
        await externalTalkRepository_1.externalTalkRepository.remove(externalTalk);
        return res.status(204).send();
    }
}
exports.default = new ExternalTalkController();
