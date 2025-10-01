"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const talkRepository_1 = require("../../repositories/talkRepository");
const messageErrors_1 = require("../../helpers/messageErrors");
const allTalks_1 = require("../../helpers/allTalks");
class TalkController {
    async create(req, res) {
        const { number, title } = req.body;
        const existingTalk = await talkRepository_1.talkRepository.findOneBy({ number });
        if (existingTalk)
            throw new api_errors_1.BadRequestError("A talk with this number already exists");
        const newTalk = talkRepository_1.talkRepository.create({ number, title });
        await talkRepository_1.talkRepository.save(newTalk);
        return res.status(201).json(newTalk);
    }
    async update(req, res) {
        const { talk_id } = req.params;
        const { number, title } = req.body;
        const talk = await talkRepository_1.talkRepository.findOneBy({ id: talk_id });
        if (!talk)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.talk);
        if (number !== undefined) {
            const existingTalk = await talkRepository_1.talkRepository.findOneBy({ number });
            if (existingTalk && existingTalk.id !== talk.id) {
                throw new api_errors_1.BadRequestError("A talk with this number already exists");
            }
            talk.number = number;
        }
        talk.title = title !== null && title !== void 0 ? title : talk.title;
        await talkRepository_1.talkRepository.save(talk);
        return res.json(talk);
    }
    async delete(req, res) {
        const { talk_id } = req.params;
        const talk = await talkRepository_1.talkRepository.findOneBy({ id: talk_id });
        if (!talk)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.talk);
        await talkRepository_1.talkRepository.remove(talk);
        return res.status(200).end();
    }
    async getTalks(req, res) {
        const talks = await talkRepository_1.talkRepository.find({
            order: { number: "ASC" },
        });
        return res.json(talks);
    }
    async getTalk(req, res) {
        const { talk_id } = req.params;
        const talk = await talkRepository_1.talkRepository.findOneBy({ id: talk_id });
        if (!talk)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.talk);
        return res.json(talk);
    }
    async importFromData(_, res) {
        const createdTalks = [];
        const talks = allTalks_1.allTalks;
        for (const talkData of talks) {
            const existingTalk = await talkRepository_1.talkRepository.findOneBy({ number: talkData.number });
            if (existingTalk) {
                continue; // se já existe, pula
            }
            const newTalk = talkRepository_1.talkRepository.create({
                number: talkData.number,
                title: talkData.title,
            });
            await talkRepository_1.talkRepository.save(newTalk);
            createdTalks.push(newTalk);
        }
        return res.status(201).json({
            message: "Talks imported successfully",
            created: createdTalks.length,
            talks: createdTalks,
        });
    }
}
exports.default = new TalkController();
