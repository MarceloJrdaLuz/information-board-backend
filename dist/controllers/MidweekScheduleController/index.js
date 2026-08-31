"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MidweekScheduleController = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
require("dayjs/locale/pt-br");
const MidweekMeetingPart_1 = require("../../entities/MidweekMeetingPart");
const api_errors_1 = require("../../helpers/api-errors");
const publisherMidweekQualificationRepository_1 = require("../../repositories/publisherMidweekQualificationRepository");
const publisherUnavailabilityRepository_1 = require("../../repositories/publisherUnavailabilityRepository");
const MidweekAutoAssignService_1 = require("../../services/midweek/MidweekAutoAssignService");
const MidweekScheduleService_1 = require("../../services/midweek/MidweekScheduleService");
const MidweekSuggestionService_1 = require("../../services/midweek/MidweekSuggestionService");
const MidweekXmlParserService_1 = require("../../services/midweek/MidweekXmlParserService");
class MidweekScheduleController {
    constructor() {
        this.scheduleService = new MidweekScheduleService_1.MidweekScheduleService();
        this.suggestionService = new MidweekSuggestionService_1.MidweekSuggestionService();
        this.autoAssignService = new MidweekAutoAssignService_1.MidweekAutoAssignService();
        this.xmlParserService = new MidweekXmlParserService_1.MidweekXmlParserService();
    }
    async importXml(req, res) {
        if (!req.file) {
            throw new api_errors_1.BadRequestError("Arquivo XML não enviado.");
        }
        const xmlContent = req.file.buffer.toString("utf-8");
        const result = await this.xmlParserService.parseAndSaveWorkbook(xmlContent);
        return res.status(200).json(result);
    }
    async getMonthSchedules(req, res) {
        const { congregation_id } = req.params;
        const year = parseInt(req.query.year, 10) || new Date().getFullYear();
        const month = parseInt(req.query.month, 10) || (new Date().getMonth() + 1);
        const schedules = await this.scheduleService.getOrGenerateMonthSchedules(congregation_id, year, month);
        return res.status(200).json(schedules);
    }
    async getScheduleById(req, res) {
        const { congregation_id, schedule_id } = req.params;
        const schedule = await this.scheduleService.getScheduleById(schedule_id, congregation_id);
        return res.status(200).json(schedule);
    }
    async updateSchedule(req, res) {
        const { congregation_id, schedule_id } = req.params;
        const updated = await this.scheduleService.updateSchedule(schedule_id, congregation_id, req.body);
        return res.status(200).json(updated);
    }
    async updatePart(req, res) {
        const { congregation_id, part_id } = req.params;
        const updated = await this.scheduleService.updatePart(part_id, congregation_id, req.body);
        return res.status(200).json(updated);
    }
    async createCustomPart(req, res) {
        const { congregation_id, schedule_id } = req.params;
        const created = await this.scheduleService.createCustomPart(schedule_id, congregation_id, req.body);
        return res.status(201).json(created);
    }
    async deletePart(req, res) {
        const { congregation_id, part_id } = req.params;
        await this.scheduleService.deletePart(part_id, congregation_id);
        return res.status(204).send();
    }
    async duplicateStudentPartsForRoom(req, res) {
        const { congregation_id, schedule_id, room } = req.params;
        const targetRoom = (room || req.body.targetRoom);
        if (!targetRoom || (targetRoom !== MidweekMeetingPart_1.MidweekRoom.AUXILIARY_1 && targetRoom !== MidweekMeetingPart_1.MidweekRoom.AUXILIARY_2)) {
            throw new api_errors_1.BadRequestError("targetRoom inválido. Deve ser AUXILIARY_1 ou AUXILIARY_2.");
        }
        await this.scheduleService.duplicateStudentPartsForRoom(schedule_id, congregation_id, targetRoom);
        const updatedSchedule = await this.scheduleService.getScheduleById(schedule_id, congregation_id);
        return res.status(200).json(updatedSchedule);
    }
    async getSuggestionsForPart(req, res) {
        const { congregation_id, part_id } = req.params;
        const isForAssistant = req.query.isAssistant === "true";
        const suggestions = await this.suggestionService.getSuggestionsForPart(part_id, congregation_id, isForAssistant);
        return res.status(200).json(suggestions);
    }
    async getSuggestionsForRole(req, res) {
        const { congregation_id, schedule_id } = req.params;
        const role = req.query.role;
        if (!role) {
            throw new api_errors_1.BadRequestError("Parâmetro 'role' é obrigatório.");
        }
        const suggestions = await this.suggestionService.getSuggestionsForRole(role, schedule_id, congregation_id);
        return res.status(200).json(suggestions);
    }
    async autoAssignSchedule(req, res) {
        const { congregation_id, schedule_id } = req.params;
        const updated = await this.autoAssignService.autoAssignSchedule(schedule_id, congregation_id);
        return res.status(200).json(updated);
    }
    async autoAssignMonth(req, res) {
        const { congregation_id } = req.params;
        const year = parseInt(req.body.year, 10) || new Date().getFullYear();
        const month = parseInt(req.body.month, 10) || (new Date().getMonth() + 1);
        const updated = await this.autoAssignService.autoAssignMonth(congregation_id, year, month);
        return res.status(200).json(updated);
    }
    async getPublisherQualification(req, res) {
        const { publisher_id } = req.params;
        let qual = await publisherMidweekQualificationRepository_1.publisherMidweekQualificationRepository.findOne({
            where: { publisher_id }
        });
        if (!qual) {
            qual = publisherMidweekQualificationRepository_1.publisherMidweekQualificationRepository.create({
                publisher_id
            });
            await publisherMidweekQualificationRepository_1.publisherMidweekQualificationRepository.save(qual);
        }
        return res.status(200).json(qual);
    }
    async updatePublisherQualification(req, res) {
        const { publisher_id } = req.params;
        let qual = await publisherMidweekQualificationRepository_1.publisherMidweekQualificationRepository.findOne({
            where: { publisher_id }
        });
        if (!qual) {
            qual = publisherMidweekQualificationRepository_1.publisherMidweekQualificationRepository.create({
                publisher_id
            });
        }
        Object.assign(qual, req.body);
        const saved = await publisherMidweekQualificationRepository_1.publisherMidweekQualificationRepository.save(qual);
        return res.status(200).json(saved);
    }
    async getUnavailabilities(req, res) {
        const { congregation_id } = req.params;
        const list = await publisherUnavailabilityRepository_1.publisherUnavailabilityRepository.find({
            where: {
                publisher: {
                    congregation: {
                        id: congregation_id
                    }
                }
            },
            relations: ["publisher", "publisher.congregation"],
            order: { startDate: "ASC" }
        });
        return res.status(200).json(list);
    }
    async createUnavailability(req, res) {
        const unavailability = publisherUnavailabilityRepository_1.publisherUnavailabilityRepository.create(req.body);
        const saved = await publisherUnavailabilityRepository_1.publisherUnavailabilityRepository.save(unavailability);
        return res.status(201).json(saved);
    }
    async deleteUnavailability(req, res) {
        const { id } = req.params;
        await publisherUnavailabilityRepository_1.publisherUnavailabilityRepository.delete(id);
        return res.status(204).send();
    }
    async getPublicSchedules(req, res) {
        const { congregation_id } = req.params;
        const now = (0, dayjs_1.default)();
        const currentYear = now.year();
        const currentMonth = now.month() + 1;
        // Busca o mês atual e o próximo mês
        const [currentMonthSchedules, nextMonthSchedules] = await Promise.all([
            this.scheduleService.getOrGenerateMonthSchedules(congregation_id, currentYear, currentMonth),
            this.scheduleService.getOrGenerateMonthSchedules(congregation_id, currentMonth === 12 ? currentYear + 1 : currentYear, currentMonth === 12 ? 1 : currentMonth + 1)
        ]);
        const allSchedules = [...currentMonthSchedules, ...nextMonthSchedules];
        const uniqueMap = new Map();
        allSchedules.forEach(s => {
            if (!uniqueMap.has(s.weekDate)) {
                uniqueMap.set(s.weekDate, s);
            }
        });
        const sorted = Array.from(uniqueMap.values()).sort((a, b) => a.weekDate.localeCompare(b.weekDate));
        const getDisplayName = (pub) => {
            var _a;
            if (!pub)
                return null;
            return ((_a = pub.nickname) === null || _a === void 0 ? void 0 : _a.trim()) || pub.fullName || null;
        };
        const mapped = sorted.map(s => {
            const dateObj = (0, dayjs_1.default)(s.meetingDate || s.weekDate);
            const monthName = dateObj.locale("pt-br").format("MMMM");
            const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
            const cbsPart = (s.parts || []).find((p) => { var _a; return p.partType === "CBS" || ((_a = p.title) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes("estudo bíblico")); });
            return {
                id: s.id,
                weekDate: s.weekDate,
                meetingDate: s.meetingDate,
                month: capitalizedMonth,
                year: dateObj.year(),
                weeklyBibleReading: s.weeklyBibleReading,
                songOpen: s.songOpen,
                songMiddle: s.songMiddle,
                songEnd: s.songEnd,
                isSpecial: Boolean(s.isSpecial),
                specialType: s.specialType,
                specialName: s.specialName,
                notes: s.notes || null,
                isCurrentWeek: (0, dayjs_1.default)().isSame(dateObj, "week") || (0, dayjs_1.default)().isSame((0, dayjs_1.default)(s.weekDate), "week"),
                chairman: getDisplayName(s.chairman),
                openingPrayer: getDisplayName(s.openingPrayer),
                closingPrayer: getDisplayName(s.closingPrayer),
                auxCounselor1: getDisplayName(s.auxCounselor1),
                auxCounselor2: getDisplayName(s.auxCounselor2),
                cbsConductor: getDisplayName(s.cbsConductor),
                cbsReader: getDisplayName(s.cbsReader),
                cbsSourceMaterial: (cbsPart === null || cbsPart === void 0 ? void 0 : cbsPart.sourceMaterial) || null,
                parts: (s.parts || [])
                    .filter((p) => { var _a; return p.isActive !== false && p.partType !== "CBS" && !((_a = p.title) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes("estudo bíblico")); })
                    .sort((a, b) => { var _a, _b; return ((_a = a.orderIndex) !== null && _a !== void 0 ? _a : 0) - ((_b = b.orderIndex) !== null && _b !== void 0 ? _b : 0); })
                    .map((p) => ({
                    id: p.id,
                    title: p.title,
                    sourceMaterial: p.sourceMaterial,
                    timeMinutes: p.timeMinutes,
                    section: p.section,
                    partType: p.partType,
                    room: p.room,
                    orderIndex: p.orderIndex,
                    requiresAssistant: p.requiresAssistant,
                    assignedPublisher: getDisplayName(p.assignedPublisher),
                    assistantPublisher: getDisplayName(p.assistantPublisher),
                    customSpeakerName: p.custom_speaker_name,
                    lessonNumber: p.lessonNumber,
                    studyPoint: p.studyPoint,
                    studyPointDescription: p.studyPointDescription
                }))
            };
        });
        const grouped = mapped.reduce((acc, item) => {
            const key = `${item.month} ${item.year}`;
            if (!acc[key])
                acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});
        return res.status(200).json(grouped);
    }
}
exports.MidweekScheduleController = MidweekScheduleController;
