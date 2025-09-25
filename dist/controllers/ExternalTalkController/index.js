"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const externalTalkRepository_1 = require("../../repositories/externalTalkRepository");
const speakerRepository_1 = require("../../repositories/speakerRepository");
const talkRepository_1 = require("../../repositories/talkRepository");
const typeorm_1 = require("typeorm");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
class ExternalTalkController {
    async create(req, res) {
        const { congregation_id } = req.params;
        const { destinationCongregation_id, speaker_id, talk_id, manualTalk, date } = req.body;
        console.log(date);
        const originCongregation = await congregationRepository_1.congregationRepository.findOne({
            where: {
                id: congregation_id
            }
        });
        if (!date) {
            throw new api_errors_1.BadRequestError("Date is required");
        }
        if (!originCongregation) {
            throw new api_errors_1.BadRequestError("Origin Congregation not found");
        }
        if (!talk_id && !manualTalk) {
            throw new api_errors_1.BadRequestError("Either talkId or manualTalk must be provided");
        }
        const speaker = await speakerRepository_1.speakerRepository.findOne({
            where: {
                id: speaker_id,
                creatorCongregation: {
                    id: congregation_id
                },
                originCongregation: {
                    id: congregation_id
                }
            },
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
        let talk = null;
        if (talk_id) {
            talk = await talkRepository_1.talkRepository.findOneBy({ id: talk_id });
            if (!talk) {
                throw new api_errors_1.BadRequestError(messageErrors_1.messageErrors.notFound.talk);
            }
        }
        const externalTalk = externalTalkRepository_1.externalTalkRepository.create({
            speaker,
            talk,
            manualTalk: talk_id ? null : manualTalk,
            destinationCongregation,
            originCongregation,
            date: (0, moment_timezone_1.default)(date).format("YYYY-MM-DD"),
            status: "pending",
        });
        await externalTalkRepository_1.externalTalkRepository.save(externalTalk);
        return res.status(201).json(externalTalk);
    }
    async getExternalTalks(req, res) {
        const { congregation_id } = req.params;
        const externalTalks = await externalTalkRepository_1.externalTalkRepository.find({
            where: {
                originCongregation: {
                    id: congregation_id
                }
            },
            relations: ["speaker", "talk", "destinationCongregation"],
            order: { date: "ASC" }
        });
        return res.json(externalTalks);
    }
    async getExternalTalksByPeriod(req, res) {
        const { congregation_id } = req.params;
        const { start, end } = req.query;
        console.log(start, end);
        const startFormatted = (0, moment_timezone_1.default)(start, "YYYY-MM-DD").format("YYYY-MM-DD");
        const endFormatted = (0, moment_timezone_1.default)(end, "YYYY-MM-DD").format("YYYY-MM-DD");
        console.log(start, startFormatted, end, endFormatted);
        const externalTalks = await externalTalkRepository_1.externalTalkRepository.find({
            where: {
                originCongregation: { id: congregation_id },
                date: (0, typeorm_1.Between)(startFormatted, endFormatted)
            },
            relations: ["speaker", "talk", "destinationCongregation"],
            order: { date: "ASC" }
        });
        console.log(externalTalks);
        return res.json(externalTalks);
    }
    async update(req, res) {
        var _a;
        const { externalTalk_id: id } = req.params;
        const { speaker_id, destinationCongregation_id, talk_id, manualTalk, status, date } = req.body;
        const externalTalk = await externalTalkRepository_1.externalTalkRepository.findOne({
            where: { id }
        });
        if (!externalTalk) {
            throw new api_errors_1.BadRequestError(messageErrors_1.messageErrors.notFound.externalTalk);
        }
        if (speaker_id) {
            const speaker = await speakerRepository_1.speakerRepository.findOneBy({ id: speaker_id });
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
        if (talk_id) {
            const talk = await talkRepository_1.talkRepository.findOneBy({ id: talk_id });
            if (!talk)
                throw new api_errors_1.BadRequestError(messageErrors_1.messageErrors.notFound.talk);
            externalTalk.talk = talk;
            externalTalk.manualTalk = null; // zera manual
        }
        else if (manualTalk) {
            externalTalk.manualTalk = manualTalk;
            externalTalk.talk = null;
        }
        if (status) {
            externalTalk.status = status;
        }
        externalTalk.date = (_a = (0, moment_timezone_1.default)(date).format("YYYY-MM-DD")) !== null && _a !== void 0 ? _a : externalTalk.date;
        await externalTalkRepository_1.externalTalkRepository.save(externalTalk);
        return res.json(externalTalk);
    }
    async updateStatus(req, res) {
        const { externalTalk_id: id } = req.params;
        const { status } = req.body;
        console.log(id, status);
        const externalTalk = await externalTalkRepository_1.externalTalkRepository.findOneBy({ id });
        if (!externalTalk) {
            throw new api_errors_1.BadRequestError("External talk not found");
        }
        externalTalk.status = status !== null && status !== void 0 ? status : externalTalk.status;
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
