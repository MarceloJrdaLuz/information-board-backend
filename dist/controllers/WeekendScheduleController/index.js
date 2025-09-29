"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const speakerRepository_1 = require("../../repositories/speakerRepository");
const talkRepository_1 = require("../../repositories/talkRepository");
const weekendScheduleRepository_1 = require("../../repositories/weekendScheduleRepository");
const months_1 = require("../../helpers/months");
const normalize_1 = require("../../functions/normalize");
class WeekendScheduleController {
    async create(req, res) {
        var _a, _b, _c, _d, _e;
        const { congregation_id } = req.params;
        const { schedules } = req.body;
        if (!schedules || schedules.length === 0) {
            throw new api_errors_1.BadRequestError("Schedules array is required");
        }
        const schedulesToSave = [];
        let groupIndex = 0;
        for (const item of schedules) {
            const scheduleDate = (0, moment_1.default)(item.date).format("YYYY-MM-DD");
            const existing = await weekendScheduleRepository_1.weekendScheduleRepository.findOne({
                where: { date: scheduleDate, congregation: { id: congregation_id } },
            });
            if (existing)
                throw new api_errors_1.BadRequestError(`A schedule already exists for ${scheduleDate}`);
            // Busca relacionamentos em paralelo
            const [speaker, talk, chairman, reader] = await Promise.all([
                item.speaker_id ? speakerRepository_1.speakerRepository.findOneBy({ id: item.speaker_id }) : null,
                item.talk_id ? talkRepository_1.talkRepository.findOneBy({ id: item.talk_id }) : null,
                item.chairman_id ? publisherRepository_1.publisherRepository.findOneBy({ id: item.chairman_id }) : null,
                item.reader_id ? publisherRepository_1.publisherRepository.findOneBy({ id: item.reader_id }) : null,
            ]);
            if (item.speaker_id && !speaker)
                throw new api_errors_1.NotFoundError(`Speaker ${item.speaker_id} not found`);
            if (item.talk_id && !talk)
                throw new api_errors_1.NotFoundError(`Talk ${item.talk_id} not found`);
            if (item.chairman_id && !chairman)
                throw new api_errors_1.NotFoundError(`Chairman ${item.chairman_id} not found`);
            if (item.reader_id && !reader)
                throw new api_errors_1.NotFoundError(`Reader ${item.reader_id} not found`);
            const newSchedule = weekendScheduleRepository_1.weekendScheduleRepository.create({
                date: scheduleDate,
                speaker,
                talk,
                chairman,
                reader,
                watchTowerStudyTitle: (_a = item.watchTowerStudyTitle) !== null && _a !== void 0 ? _a : null,
                congregation: { id: congregation_id },
                isSpecial: (_b = item.isSpecial) !== null && _b !== void 0 ? _b : false,
                specialName: (_c = item.specialName) !== null && _c !== void 0 ? _c : null,
                manualSpeaker: (_d = item.manualSpeaker) !== null && _d !== void 0 ? _d : null,
                manualTalk: (_e = item.manualTalk) !== null && _e !== void 0 ? _e : null,
            });
            schedulesToSave.push(newSchedule);
        }
        const savedSchedules = await weekendScheduleRepository_1.weekendScheduleRepository.save(schedulesToSave);
        return res.status(201).json(savedSchedules);
    }
    async update(req, res) {
        const { schedules } = req.body;
        if (!schedules || schedules.length === 0)
            throw new api_errors_1.BadRequestError("Schedules array is required");
        const schedulesToSave = [];
        for (const item of schedules) {
            if (!item.id)
                throw new api_errors_1.BadRequestError("Schedule ID is required for update");
            const schedule = await weekendScheduleRepository_1.weekendScheduleRepository.findOne({
                where: { id: item.id },
                relations: ["speaker", "talk", "chairman", "reader", "hospitalityGroup", "congregation"]
            });
            if (!schedule)
                throw new api_errors_1.NotFoundError(`WeekendSchedule ${item.id} not found`);
            if (item.date) {
                const newDate = (0, moment_1.default)(item.date).format("YYYY-MM-DD");
                const conflict = await weekendScheduleRepository_1.weekendScheduleRepository.findOne({
                    where: { date: newDate, congregation: { id: schedule.congregation.id } }
                });
                if (conflict && conflict.id !== schedule.id)
                    throw new api_errors_1.BadRequestError(`A schedule already exists for ${newDate}`);
                schedule.date = newDate;
            }
            // Busca relacionamentos em paralelo
            const [speaker, talk, chairman, reader] = await Promise.all([
                item.speaker_id !== undefined ? (item.speaker_id ? speakerRepository_1.speakerRepository.findOneBy({ id: item.speaker_id }) : null) : schedule.speaker,
                item.talk_id !== undefined ? (item.talk_id ? talkRepository_1.talkRepository.findOneBy({ id: item.talk_id }) : null) : schedule.talk,
                item.chairman_id !== undefined ? (item.chairman_id ? publisherRepository_1.publisherRepository.findOneBy({ id: item.chairman_id }) : null) : schedule.chairman,
                item.reader_id !== undefined ? (item.reader_id ? publisherRepository_1.publisherRepository.findOneBy({ id: item.reader_id }) : null) : schedule.reader,
            ]);
            if (item.speaker_id && !speaker)
                throw new api_errors_1.NotFoundError(`Speaker ${item.speaker_id} not found`);
            if (item.talk_id && !talk)
                throw new api_errors_1.NotFoundError(`Talk ${item.talk_id} not found`);
            if (item.chairman_id && !chairman)
                throw new api_errors_1.NotFoundError(`Chairman ${item.chairman_id} not found`);
            if (item.reader_id && !reader)
                throw new api_errors_1.NotFoundError(`Reader ${item.reader_id} not found`);
            schedule.speaker = speaker;
            schedule.talk = talk;
            schedule.chairman = chairman;
            schedule.reader = reader;
            schedule.watchTowerStudyTitle = item.watchTowerStudyTitle !== undefined ? item.watchTowerStudyTitle : schedule.watchTowerStudyTitle;
            if (item.isSpecial !== undefined) {
                schedule.isSpecial = item.isSpecial;
            }
            if (item.specialName !== undefined) {
                schedule.specialName = item.specialName;
            }
            if (item.manualSpeaker !== undefined) {
                schedule.manualSpeaker = item.manualSpeaker;
            }
            if (item.manualTalk !== undefined) {
                schedule.manualTalk = item.manualTalk;
            }
            schedulesToSave.push(schedule);
        }
        const savedSchedules = await weekendScheduleRepository_1.weekendScheduleRepository.save(schedulesToSave);
        return res.json(savedSchedules);
    }
    async delete(req, res) {
        const { weekendSchedule_id } = req.params;
        const schedule = await weekendScheduleRepository_1.weekendScheduleRepository.findOneBy({ id: weekendSchedule_id });
        if (!schedule)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.weekendSchedule);
        await weekendScheduleRepository_1.weekendScheduleRepository.remove(schedule);
        return res.status(200).end();
    }
    async getSchedules(req, res) {
        const { congregation_id } = req.params;
        const schedules = await weekendScheduleRepository_1.weekendScheduleRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["speaker", "talk", "chairman", "reader", "congregation"],
            order: { date: "ASC" },
        });
        return res.json(schedules);
    }
    async getSchedule(req, res) {
        const { weekendSchedule_id } = req.params;
        const schedule = await weekendScheduleRepository_1.weekendScheduleRepository.findOne({
            where: { id: weekendSchedule_id },
            relations: ["speaker", "talk", "chairman", "reader"],
        });
        if (!schedule)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.weekendSchedule);
        return res.json(schedule);
    }
    async getPublicSchedules(req, res) {
        const { congregation_id } = req.params;
        const schedules = await weekendScheduleRepository_1.weekendScheduleRepository.find({
            where: { congregation: { id: congregation_id } },
            relations: ["speaker", "talk", "chairman", "reader", "speaker.originCongregation"],
            order: { date: "ASC" },
        });
        const today = (0, moment_1.default)();
        const mapped = schedules.map(s => {
            var _a, _b;
            const date = (0, moment_1.default)(s.date, "YYYY-MM-DD");
            const month = months_1.monthNames[date.month()];
            return {
                id: s.id,
                date: s.date,
                month,
                isCurrentWeek: today.isSame(date, "week"),
                isSpecial: s.isSpecial,
                specialName: s.specialName,
                chairman: s.chairman ? { name: (_a = s.chairman.nickname) !== null && _a !== void 0 ? _a : s.chairman.fullName } : null,
                reader: s.reader ? { name: (_b = s.reader.nickname) !== null && _b !== void 0 ? _b : s.reader.fullName } : null,
                speaker: s.speaker
                    ? {
                        name: s.speaker.fullName,
                        congregation: s.speaker.originCongregation
                            ? (0, normalize_1.normalize)(s.speaker.originCongregation.city) === (0, normalize_1.normalize)(s.speaker.originCongregation.name)
                                ? `${(0, normalize_1.normalize)(s.speaker.originCongregation.city)}`
                                : `${(0, normalize_1.normalize)(s.speaker.originCongregation.name)} - ${(0, normalize_1.normalize)(s.speaker.originCongregation.city)}`
                            : null,
                    }
                    : (s.manualSpeaker ? { name: s.manualSpeaker } : null),
                talk: s.talk
                    ? { title: s.talk.title, number: s.talk.number }
                    : (s.manualTalk ? { title: s.manualTalk } : null),
                watchTowerStudyTitle: s.watchTowerStudyTitle,
            };
        });
        // Agrupa por mês
        const grouped = mapped.reduce((acc, item) => {
            if (!acc[item.month])
                acc[item.month] = [];
            acc[item.month].push(item);
            return acc;
        }, {});
        return res.json(grouped);
    }
}
exports.default = new WeekendScheduleController();
