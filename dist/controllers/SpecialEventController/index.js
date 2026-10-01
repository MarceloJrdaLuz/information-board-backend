"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncEventImpacts = exports.getAffectedWeekendDates = exports.mapSpecialEventTypeToMidweek = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const isoWeek_1 = __importDefault(require("dayjs/plugin/isoWeek"));
const isSameOrAfter_1 = __importDefault(require("dayjs/plugin/isSameOrAfter"));
const isSameOrBefore_1 = __importDefault(require("dayjs/plugin/isSameOrBefore"));
const typeorm_1 = require("typeorm");
const MidweekMeetingPart_1 = require("../../entities/MidweekMeetingPart");
const MidweekSchedule_1 = require("../../entities/MidweekSchedule");
const SpecialEvent_1 = require("../../entities/SpecialEvent");
const api_errors_1 = require("../../helpers/api-errors");
const permissions_1 = require("../../middlewares/permissions");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const midweekMeetingPartRepository_1 = require("../../repositories/midweekMeetingPartRepository");
const midweekScheduleRepository_1 = require("../../repositories/midweekScheduleRepository");
const specialEventRepository_1 = require("../../repositories/specialEventRepository");
const userRepository_1 = require("../../repositories/userRepository");
const weekendScheduleRepository_1 = require("../../repositories/weekendScheduleRepository");
dayjs_1.default.extend(isoWeek_1.default);
dayjs_1.default.extend(isSameOrBefore_1.default);
dayjs_1.default.extend(isSameOrAfter_1.default);
function mapSpecialEventTypeToMidweek(type) {
    switch (type) {
        case SpecialEvent_1.SpecialEventType.CIRCUIT_ASSEMBLY:
            return MidweekSchedule_1.MidweekSpecialType.CIRCUIT_ASSEMBLY;
        case SpecialEvent_1.SpecialEventType.REGIONAL_CONVENTION:
            return MidweekSchedule_1.MidweekSpecialType.REGIONAL_CONVENTION;
        case SpecialEvent_1.SpecialEventType.MEMORIAL:
            return MidweekSchedule_1.MidweekSpecialType.MEMORIAL;
        case SpecialEvent_1.SpecialEventType.CIRCUIT_OVERSEER_VISIT:
            return MidweekSchedule_1.MidweekSpecialType.CIRCUIT_OVERSEER_VISIT;
        case SpecialEvent_1.SpecialEventType.SPECIAL_TALK:
            return MidweekSchedule_1.MidweekSpecialType.SPECIAL_TALK;
        default:
            return MidweekSchedule_1.MidweekSpecialType.CUSTOM;
    }
}
exports.mapSpecialEventTypeToMidweek = mapSpecialEventTypeToMidweek;
class SpecialEventController {
    /**
     * Lista eventos especiais da congregação (com filtros opcionais)
     */
    async list(req, res) {
        const { congregation_id } = req.params;
        const { futureOnly, year } = req.query;
        const whereClause = {
            congregation: { id: congregation_id }
        };
        if (futureOnly === "true") {
            const today = (0, dayjs_1.default)().format("YYYY-MM-DD");
            whereClause.endDate = (0, typeorm_1.MoreThanOrEqual)(today);
        }
        else if (year) {
            const startOfYear = `${year}-01-01`;
            const endOfYear = `${year}-12-31`;
            whereClause.startDate = (0, typeorm_1.Between)(startOfYear, endOfYear);
        }
        const events = await specialEventRepository_1.specialEventRepository.find({
            where: whereClause,
            order: {
                startDate: futureOnly === "true" ? "ASC" : "DESC"
            }
        });
        // Garante sincronização de eventos ativos
        for (const evt of events) {
            await syncEventImpacts(evt);
        }
        return res.status(200).json(events);
    }
    /**
     * Lista pública de eventos especiais por ID da congregação (para o Quadro de Anúncios)
     */
    async getPublicEvents(req, res) {
        const { congregation_id } = req.params;
        const recentDate = (0, dayjs_1.default)().subtract(7, "day").format("YYYY-MM-DD");
        const events = await specialEventRepository_1.specialEventRepository.find({
            where: {
                congregation: { id: congregation_id },
                showOnPublicBoard: true,
                endDate: (0, typeorm_1.MoreThanOrEqual)(recentDate)
            },
            order: {
                startDate: "ASC"
            }
        });
        return res.status(200).json(events);
    }
    /**
     * Lista pública de eventos especiais por número da congregação
     */
    async getPublicEventsByNumber(req, res) {
        const { number } = req.params;
        const congregation = await congregationRepository_1.congregationRepository.findOne({
            where: { number }
        });
        if (!congregation) {
            throw new api_errors_1.NotFoundError("Congregação não encontrada.");
        }
        const recentDate = (0, dayjs_1.default)().subtract(7, "day").format("YYYY-MM-DD");
        const events = await specialEventRepository_1.specialEventRepository.find({
            where: {
                congregation: { id: congregation.id },
                showOnPublicBoard: true,
                endDate: (0, typeorm_1.MoreThanOrEqual)(recentDate)
            },
            order: {
                startDate: "ASC"
            }
        });
        return res.status(200).json(events);
    }
    /**
     * Cria um novo evento especial e sincroniza automaticamente com as programações
     */
    async create(req, res) {
        const { congregation_id } = req.params;
        const { type, title, startDate, endDate, affectsWholeWeek, cancelMidweekMeeting, cancelWeekendMeeting, isCircuitOverseerVisit, cancelCleaning, fieldServiceImpact, publicWitnessingImpact, showOnPublicBoard, theme, location, notes } = req.body;
        if (!title || !startDate || !endDate || !type) {
            throw new api_errors_1.BadRequestError("Título, tipo, data de início e data de fim são obrigatórios.");
        }
        const start = (0, dayjs_1.default)(startDate);
        const end = (0, dayjs_1.default)(endDate);
        if (!start.isValid() || !end.isValid()) {
            throw new api_errors_1.BadRequestError("Formato de data inválido. Use YYYY-MM-DD.");
        }
        if (end.isBefore(start)) {
            throw new api_errors_1.BadRequestError("A data de término não pode ser anterior à data de início.");
        }
        const congregation = await congregationRepository_1.congregationRepository.findOne({
            where: { id: congregation_id }
        });
        if (!congregation) {
            throw new api_errors_1.NotFoundError("Congregação não encontrada.");
        }
        const newEvent = specialEventRepository_1.specialEventRepository.create({
            congregation: { id: congregation_id },
            congregation_id,
            type: type,
            title: title.trim(),
            startDate: start.format("YYYY-MM-DD"),
            endDate: end.format("YYYY-MM-DD"),
            affectsWholeWeek: affectsWholeWeek !== null && affectsWholeWeek !== void 0 ? affectsWholeWeek : true,
            cancelMidweekMeeting: cancelMidweekMeeting !== null && cancelMidweekMeeting !== void 0 ? cancelMidweekMeeting : false,
            cancelWeekendMeeting: cancelWeekendMeeting !== null && cancelWeekendMeeting !== void 0 ? cancelWeekendMeeting : false,
            isCircuitOverseerVisit: isCircuitOverseerVisit !== null && isCircuitOverseerVisit !== void 0 ? isCircuitOverseerVisit : (type === SpecialEvent_1.SpecialEventType.CIRCUIT_OVERSEER_VISIT),
            cancelCleaning: cancelCleaning !== null && cancelCleaning !== void 0 ? cancelCleaning : false,
            fieldServiceImpact: fieldServiceImpact !== null && fieldServiceImpact !== void 0 ? fieldServiceImpact : SpecialEvent_1.EventImpactScope.NONE,
            publicWitnessingImpact: publicWitnessingImpact !== null && publicWitnessingImpact !== void 0 ? publicWitnessingImpact : SpecialEvent_1.EventImpactScope.NONE,
            showOnPublicBoard: showOnPublicBoard !== null && showOnPublicBoard !== void 0 ? showOnPublicBoard : true,
            theme: (theme === null || theme === void 0 ? void 0 : theme.trim()) || null,
            location: (location === null || location === void 0 ? void 0 : location.trim()) || null,
            notes: (notes === null || notes === void 0 ? void 0 : notes.trim()) || null
        });
        const savedEvent = await specialEventRepository_1.specialEventRepository.save(newEvent);
        // Sincroniza impactos automáticos
        await syncEventImpacts(savedEvent);
        return res.status(201).json(savedEvent);
    }
    /**
     * Atualiza um evento especial e re-sincroniza os impactos
     */
    async update(req, res) {
        var _a;
        const { id } = req.params;
        const event = await specialEventRepository_1.specialEventRepository.findOne({
            where: { id },
            relations: ["congregation"]
        });
        if (!event) {
            throw new api_errors_1.NotFoundError("Evento especial não encontrado.");
        }
        const user = await (0, permissions_1.decoder)(req);
        const userRoles = (_a = user === null || user === void 0 ? void 0 : user.roles) === null || _a === void 0 ? void 0 : _a.map(role => role.name);
        if (!(userRoles === null || userRoles === void 0 ? void 0 : userRoles.includes("ADMIN"))) {
            const userCongregation = await userRepository_1.userRepository.find({
                where: {
                    id: user.id,
                    congregation: { id: event.congregation_id }
                }
            });
            if (userCongregation.length < 1) {
                throw new api_errors_1.UnauthorizedError('Usuário não tem permissão nesta congregação.');
            }
        }
        const { type, title, startDate, endDate, affectsWholeWeek, cancelMidweekMeeting, cancelWeekendMeeting, isCircuitOverseerVisit, cancelCleaning, fieldServiceImpact, publicWitnessingImpact, showOnPublicBoard, theme, location, notes } = req.body;
        if (title !== undefined)
            event.title = title.trim();
        if (type !== undefined)
            event.type = type;
        if (startDate !== undefined)
            event.startDate = (0, dayjs_1.default)(startDate).format("YYYY-MM-DD");
        if (endDate !== undefined)
            event.endDate = (0, dayjs_1.default)(endDate).format("YYYY-MM-DD");
        if (affectsWholeWeek !== undefined)
            event.affectsWholeWeek = affectsWholeWeek;
        if (cancelMidweekMeeting !== undefined)
            event.cancelMidweekMeeting = cancelMidweekMeeting;
        if (cancelWeekendMeeting !== undefined)
            event.cancelWeekendMeeting = cancelWeekendMeeting;
        if (isCircuitOverseerVisit !== undefined)
            event.isCircuitOverseerVisit = isCircuitOverseerVisit;
        if (cancelCleaning !== undefined)
            event.cancelCleaning = cancelCleaning;
        if (fieldServiceImpact !== undefined)
            event.fieldServiceImpact = fieldServiceImpact;
        if (publicWitnessingImpact !== undefined)
            event.publicWitnessingImpact = publicWitnessingImpact;
        if (showOnPublicBoard !== undefined)
            event.showOnPublicBoard = showOnPublicBoard;
        if (theme !== undefined)
            event.theme = (theme === null || theme === void 0 ? void 0 : theme.trim()) || null;
        if (location !== undefined)
            event.location = (location === null || location === void 0 ? void 0 : location.trim()) || null;
        if (notes !== undefined)
            event.notes = (notes === null || notes === void 0 ? void 0 : notes.trim()) || null;
        const updatedEvent = await specialEventRepository_1.specialEventRepository.save(event);
        // Re-sincroniza
        await syncEventImpacts(updatedEvent);
        return res.status(200).json(updatedEvent);
    }
    /**
     * Exclui o evento especial e reverte status de reuniões caso tenham sido marcadas
     */
    async delete(req, res) {
        var _a;
        const { id } = req.params;
        const event = await specialEventRepository_1.specialEventRepository.findOne({
            where: { id },
            relations: ["congregation"]
        });
        if (!event) {
            throw new api_errors_1.NotFoundError("Evento especial não encontrado.");
        }
        const user = await (0, permissions_1.decoder)(req);
        const userRoles = (_a = user === null || user === void 0 ? void 0 : user.roles) === null || _a === void 0 ? void 0 : _a.map(role => role.name);
        if (!(userRoles === null || userRoles === void 0 ? void 0 : userRoles.includes("ADMIN"))) {
            const userCongregation = await userRepository_1.userRepository.find({
                where: {
                    id: user.id,
                    congregation: { id: event.congregation_id }
                }
            });
            if (userCongregation.length < 1) {
                throw new api_errors_1.UnauthorizedError('Usuário não tem permissão nesta congregação.');
            }
        }
        // Busca outros eventos especiais da congregação (exceto este que está sendo excluído)
        const otherEvents = await specialEventRepository_1.specialEventRepository.find({
            where: {
                congregation_id: event.congregation_id,
                id: (0, typeorm_1.Not)(id)
            }
        });
        // 1. Reverte marcação em MidweekSchedules que caem no período deste evento
        const startWeek = (0, dayjs_1.default)(event.startDate).startOf("isoWeek").format("YYYY-MM-DD");
        const endWeek = (0, dayjs_1.default)(event.endDate).endOf("isoWeek").format("YYYY-MM-DD");
        const midweekSchedules = await midweekScheduleRepository_1.midweekScheduleRepository.find({
            where: {
                congregation_id: event.congregation_id,
                weekDate: (0, typeorm_1.Between)(startWeek, endWeek)
            }
        });
        for (const schedule of midweekSchedules) {
            const schedWeekStart = (0, dayjs_1.default)(schedule.weekDate).startOf("isoWeek");
            const schedWeekEnd = (0, dayjs_1.default)(schedule.weekDate).endOf("isoWeek");
            const otherMatchingEvent = otherEvents.find(ev => {
                const evStart = (0, dayjs_1.default)(ev.startDate);
                const evEnd = (0, dayjs_1.default)(ev.endDate);
                if (ev.affectsWholeWeek) {
                    return evStart.startOf("isoWeek").isSameOrBefore(schedWeekEnd) && evEnd.endOf("isoWeek").isSameOrAfter(schedWeekStart);
                }
                return evStart.isSameOrBefore(schedWeekEnd) && evEnd.isSameOrAfter(schedWeekStart);
            });
            if (!otherMatchingEvent) {
                schedule.isSpecial = false;
                schedule.specialType = MidweekSchedule_1.MidweekSpecialType.NONE;
                schedule.specialName = null;
                await midweekScheduleRepository_1.midweekScheduleRepository.save(schedule);
            }
        }
        // 2. Reverte marcação em WeekendSchedules que caem no período deste evento
        const congregation = await congregationRepository_1.congregationRepository.findOne({
            where: { id: event.congregation_id }
        });
        const affectedDates = getAffectedWeekendDates(event.startDate, event.endDate, true, // cobre a semana inteira para garantir todas as datas possíveis
        congregation === null || congregation === void 0 ? void 0 : congregation.dayMeetingPublic);
        for (const date of affectedDates) {
            const otherMatchingEvent = otherEvents.find(ev => {
                const dates = getAffectedWeekendDates(ev.startDate, ev.endDate, ev.affectsWholeWeek, congregation === null || congregation === void 0 ? void 0 : congregation.dayMeetingPublic);
                return dates.includes(date);
            });
            if (!otherMatchingEvent) {
                const ws = await weekendScheduleRepository_1.weekendScheduleRepository.findOne({
                    where: {
                        congregation: { id: event.congregation_id },
                        date
                    },
                    relations: ["speaker", "talk", "chairman", "reader", "visitingCongregation"]
                });
                if (ws) {
                    const isEmptyPlaceholder = !ws.speaker && !ws.talk && !ws.chairman && !ws.reader &&
                        !ws.visitingCongregation && !ws.manualSpeaker && !ws.manualTalk && !ws.watchTowerStudyTitle;
                    if (isEmptyPlaceholder) {
                        await weekendScheduleRepository_1.weekendScheduleRepository.delete(ws.id);
                    }
                    else {
                        ws.isSpecial = false;
                        ws.specialName = null;
                        await weekendScheduleRepository_1.weekendScheduleRepository.save(ws);
                    }
                }
            }
        }
        await specialEventRepository_1.specialEventRepository.delete(id);
        return res.status(204).send();
    }
}
/**
 * Retorna as datas de fim de semana (Sábado/Domingo ou dia de reunião) afetadas por um evento
 */
function getAffectedWeekendDates(startDate, endDate, affectsWholeWeek, dayMeetingPublic) {
    const dates = [];
    const start = (0, dayjs_1.default)(startDate);
    const end = (0, dayjs_1.default)(endDate);
    const rangeStart = affectsWholeWeek ? start.startOf("isoWeek") : start;
    const rangeEnd = affectsWholeWeek ? end.endOf("isoWeek") : end;
    let targetWeekdays = [6, 7]; // Padrão: Sábado e Domingo
    if (dayMeetingPublic === "Sábado" || dayMeetingPublic === "Sabado") {
        targetWeekdays = [6];
    }
    else if (dayMeetingPublic === "Domingo") {
        targetWeekdays = [7];
    }
    else if (dayMeetingPublic === "Sexta-feira" || dayMeetingPublic === "Sexta") {
        targetWeekdays = [5];
    }
    let cur = rangeStart.clone();
    while (cur.isSameOrBefore(rangeEnd, "day")) {
        const isoWeekday = cur.isoWeekday();
        if (targetWeekdays.includes(isoWeekday)) {
            if (affectsWholeWeek || (cur.isSameOrAfter(start, "day") && cur.isSameOrBefore(end, "day"))) {
                dates.push(cur.format("YYYY-MM-DD"));
            }
        }
        cur = cur.add(1, "day");
    }
    // Se o evento caiu no fim de semana mas targetWeekdays não capturou por incompatibilidade:
    if (dates.length === 0 && (start.isoWeekday() === 6 || start.isoWeekday() === 7)) {
        dates.push(start.format("YYYY-MM-DD"));
    }
    return dates;
}
exports.getAffectedWeekendDates = getAffectedWeekendDates;
/**
 * Propaga os impactos do evento para as programações de Reunião de Meio e Fim de Semana
 */
async function syncEventImpacts(event) {
    const startWeek = (0, dayjs_1.default)(event.startDate).startOf("isoWeek").format("YYYY-MM-DD");
    const endWeek = (0, dayjs_1.default)(event.endDate).endOf("isoWeek").format("YYYY-MM-DD");
    const congregation = await congregationRepository_1.congregationRepository.findOne({
        where: { id: event.congregation_id }
    });
    // 1. Sincroniza Reunião de Meio de Semana
    if (event.cancelMidweekMeeting || event.isCircuitOverseerVisit) {
        const schedules = await midweekScheduleRepository_1.midweekScheduleRepository.find({
            where: {
                congregation: { id: event.congregation_id },
                weekDate: (0, typeorm_1.Between)(startWeek, endWeek)
            },
            relations: ["parts"]
        });
        for (const schedule of schedules) {
            schedule.isSpecial = true;
            schedule.specialName = event.title;
            if (event.cancelMidweekMeeting) {
                schedule.specialType = mapSpecialEventTypeToMidweek(event.type);
                // Limpa participantes se não for visita de superintendente
                if (schedule.specialType !== MidweekSchedule_1.MidweekSpecialType.CIRCUIT_OVERSEER_VISIT) {
                    schedule.chairman = null;
                    schedule.chairman_id = null;
                    schedule.openingPrayer = null;
                    schedule.opening_prayer_id = null;
                    schedule.closingPrayer = null;
                    schedule.closing_prayer_id = null;
                    schedule.auxCounselor1 = null;
                    schedule.aux_counselor_1_id = null;
                    schedule.auxCounselor2 = null;
                    schedule.aux_counselor_2_id = null;
                    schedule.cbsConductor = null;
                    schedule.cbs_conductor_id = null;
                    schedule.cbsReader = null;
                    schedule.cbs_reader_id = null;
                    await midweekMeetingPartRepository_1.midweekMeetingPartRepository
                        .createQueryBuilder()
                        .update(MidweekMeetingPart_1.MidweekMeetingPart)
                        .set({
                        assigned_publisher_id: null,
                        assistant_publisher_id: null
                    })
                        .where("schedule_id = :id", { id: schedule.id })
                        .execute();
                }
            }
            else if (event.isCircuitOverseerVisit) {
                schedule.specialType = MidweekSchedule_1.MidweekSpecialType.CIRCUIT_OVERSEER_VISIT;
            }
            await midweekScheduleRepository_1.midweekScheduleRepository.save(schedule);
        }
    }
    // 2. Sincroniza Reunião de Fim de Semana
    const affectedWeekendDates = getAffectedWeekendDates(event.startDate, event.endDate, event.affectsWholeWeek, congregation === null || congregation === void 0 ? void 0 : congregation.dayMeetingPublic);
    for (const date of affectedWeekendDates) {
        let ws = await weekendScheduleRepository_1.weekendScheduleRepository.findOne({
            where: {
                congregation: { id: event.congregation_id },
                date
            },
            relations: ["speaker", "talk", "chairman", "reader", "visitingCongregation"]
        });
        if (ws) {
            ws.isSpecial = true;
            if (!ws.specialName)
                ws.specialName = event.title;
            if (event.cancelWeekendMeeting) {
                ws.speaker = null;
                ws.talk = null;
                ws.chairman = null;
                ws.reader = null;
                ws.visitingCongregation = null;
                ws.manualSpeaker = null;
                ws.manualTalk = null;
            }
            await weekendScheduleRepository_1.weekendScheduleRepository.save(ws);
        }
        else {
            ws = weekendScheduleRepository_1.weekendScheduleRepository.create({
                congregation: { id: event.congregation_id },
                date,
                isSpecial: true,
                specialName: event.title,
                watchTowerStudyTitle: null,
                chairman: null,
                reader: null,
                speaker: null,
                talk: null,
                manualSpeaker: null,
                manualTalk: null
            });
            await weekendScheduleRepository_1.weekendScheduleRepository.save(ws);
        }
    }
}
exports.syncEventImpacts = syncEventImpacts;
exports.default = new SpecialEventController();
