"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MidweekAutoAssignService = void 0;
const MidweekWorkbookPart_1 = require("../../entities/MidweekWorkbookPart");
const midweekMeetingPartRepository_1 = require("../../repositories/midweekMeetingPartRepository");
const midweekScheduleRepository_1 = require("../../repositories/midweekScheduleRepository");
const MidweekScheduleService_1 = require("./MidweekScheduleService");
const MidweekSuggestionService_1 = require("./MidweekSuggestionService");
class MidweekAutoAssignService {
    constructor() {
        this.scheduleService = new MidweekScheduleService_1.MidweekScheduleService();
        this.suggestionService = new MidweekSuggestionService_1.MidweekSuggestionService();
    }
    pickBest(suggestions, assignedThisSession, allowConflict = false) {
        // 1. Tenta quem não está ausente, não tinha conflito prévio E ainda não foi designado nesta sessão
        const ideal = suggestions.find(s => !s.isUnavailable && !s.hasConflictSameWeek && !assignedThisSession.has(s.id));
        if (ideal)
            return ideal;
        // 2. Tenta quem não está ausente e ainda não foi designado nesta sessão (mesmo com outro conflito menor)
        const noSessionConflict = suggestions.find(s => !s.isUnavailable && !assignedThisSession.has(s.id));
        if (noSessionConflict)
            return noSessionConflict;
        // 3. Se não houver ninguém sem designação na sessão e allowConflict for true, pega a melhor sugestão não-ausente
        if (allowConflict) {
            return suggestions.find(s => !s.isUnavailable);
        }
        return undefined;
    }
    async autoAssignSchedule(scheduleId, congregationId, options = { chairmanPrays: true }) {
        let schedule = await this.scheduleService.getScheduleById(scheduleId, congregationId);
        const assignedThisSession = new Set();
        // Registra quem já está fixado manualmente
        if (schedule.chairman_id)
            assignedThisSession.add(schedule.chairman_id);
        if (schedule.opening_prayer_id && schedule.opening_prayer_id !== schedule.chairman_id)
            assignedThisSession.add(schedule.opening_prayer_id);
        if (schedule.closing_prayer_id)
            assignedThisSession.add(schedule.closing_prayer_id);
        if (schedule.cbs_conductor_id)
            assignedThisSession.add(schedule.cbs_conductor_id);
        if (schedule.cbs_reader_id)
            assignedThisSession.add(schedule.cbs_reader_id);
        for (const p of schedule.parts) {
            if (p.assigned_publisher_id)
                assignedThisSession.add(p.assigned_publisher_id);
        }
        // 1. Presidente da Reunião
        if (!schedule.chairman_id) {
            const suggestions = await this.suggestionService.getSuggestionsForRole("CHAIRMAN", schedule.id, congregationId);
            const best = this.pickBest(suggestions, assignedThisSession, true);
            if (best) {
                schedule.chairman_id = best.id;
                assignedThisSession.add(best.id);
            }
        }
        // 2. Oração Inicial (Presidente ora por padrão se options.chairmanPrays for true)
        if (options.chairmanPrays && schedule.chairman_id) {
            schedule.opening_prayer_id = schedule.chairman_id;
        }
        else if (!schedule.opening_prayer_id) {
            const suggestions = await this.suggestionService.getSuggestionsForRole("OPENING_PRAYER", schedule.id, congregationId);
            const best = this.pickBest(suggestions, assignedThisSession, true);
            if (best) {
                schedule.opening_prayer_id = best.id;
                assignedThisSession.add(best.id);
            }
        }
        // 3. Dirigente do Estudo Bíblico (CBS Conductor)
        if (!schedule.cbs_conductor_id) {
            const suggestions = await this.suggestionService.getSuggestionsForRole("CBS_CONDUCTOR", schedule.id, congregationId);
            const best = this.pickBest(suggestions, assignedThisSession, true);
            if (best) {
                schedule.cbs_conductor_id = best.id;
                assignedThisSession.add(best.id);
            }
        }
        // 4. Leitor do Estudo Bíblico (CBS Reader)
        if (!schedule.cbs_reader_id) {
            const suggestions = await this.suggestionService.getSuggestionsForRole("CBS_READER", schedule.id, congregationId);
            const best = this.pickBest(suggestions, assignedThisSession, true);
            if (best) {
                schedule.cbs_reader_id = best.id;
                assignedThisSession.add(best.id);
            }
        }
        // 5. Partes da Reunião (Tesouros, Vida Cristã e Ministério) - Ignora CBS pois é tratado pelo Dirigente/Leitor
        for (const part of schedule.parts) {
            if (part.partType === MidweekWorkbookPart_1.MidweekPartType.CBS || part.title.toLowerCase().includes("estudo bíblico")) {
                continue;
            }
            // 5.1. Titular da Parte
            if (!part.assigned_publisher_id) {
                const partSuggestions = await this.suggestionService.getSuggestionsForPart(part.id, congregationId, false);
                const bestPartPub = this.pickBest(partSuggestions, assignedThisSession, true);
                if (bestPartPub) {
                    part.assigned_publisher_id = bestPartPub.id;
                    assignedThisSession.add(bestPartPub.id);
                    await midweekMeetingPartRepository_1.midweekMeetingPartRepository.update(part.id, {
                        assigned_publisher_id: bestPartPub.id
                    });
                }
            }
            // 5.2. Ajudante da Parte (permite quem já é ajudante ou leitor em caso de poucos varões/irmãs)
            if (part.requiresAssistant && !part.assistant_publisher_id && part.assigned_publisher_id) {
                const asstSuggestions = await this.suggestionService.getSuggestionsForPart(part.id, congregationId, true);
                const bestAsst = this.pickBest(asstSuggestions, assignedThisSession, true);
                if (bestAsst) {
                    part.assistant_publisher_id = bestAsst.id;
                    assignedThisSession.add(bestAsst.id);
                    await midweekMeetingPartRepository_1.midweekMeetingPartRepository.update(part.id, {
                        assistant_publisher_id: bestAsst.id
                    });
                }
            }
        }
        // 6. Oração Final (procura outro irmão que ainda não tenha parte ou melhor disponível)
        if (!schedule.closing_prayer_id) {
            const suggestions = await this.suggestionService.getSuggestionsForRole("CLOSING_PRAYER", schedule.id, congregationId);
            const best = this.pickBest(suggestions, assignedThisSession, true);
            if (best) {
                schedule.closing_prayer_id = best.id;
                assignedThisSession.add(best.id);
            }
        }
        // Atualiza campos do schedule no banco
        await midweekScheduleRepository_1.midweekScheduleRepository.update(schedule.id, {
            chairman_id: schedule.chairman_id,
            opening_prayer_id: schedule.opening_prayer_id,
            closing_prayer_id: schedule.closing_prayer_id,
            cbs_conductor_id: schedule.cbs_conductor_id,
            cbs_reader_id: schedule.cbs_reader_id
        });
        return await this.scheduleService.getScheduleById(scheduleId, congregationId);
    }
    async autoAssignMonth(congregationId, year, month, options = { chairmanPrays: true }) {
        const schedules = await this.scheduleService.getOrGenerateMonthSchedules(congregationId, year, month);
        const results = [];
        for (const schedule of schedules) {
            const assigned = await this.autoAssignSchedule(schedule.id, congregationId, options);
            results.push(assigned);
        }
        return results;
    }
}
exports.MidweekAutoAssignService = MidweekAutoAssignService;
