"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCurrentWeekend = exports.filterExternalTalksForWeekend = exports.getWeekendRange = void 0;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
function getWeekendRange(localMeetingDate) {
    const base = (0, moment_timezone_1.default)(localMeetingDate);
    const sunday = base.clone().isoWeekday(7);
    const saturday = sunday.clone().subtract(1, "day");
    const friday = sunday.clone().subtract(2, "days");
    return {
        friday: friday.format("YYYY-MM-DD"),
        saturday: saturday.format("YYYY-MM-DD"),
        sunday: sunday.format("YYYY-MM-DD"),
    };
}
exports.getWeekendRange = getWeekendRange;
function filterExternalTalksForWeekend(externalTalks, localDate) {
    const range = getWeekendRange(localDate);
    return externalTalks.filter(ext => {
        const d = (0, moment_timezone_1.default)(ext.date);
        return d.isBetween(range.friday, range.sunday, undefined, "[]"); // [] = inclusive
    });
}
exports.filterExternalTalksForWeekend = filterExternalTalksForWeekend;
function isCurrentWeekend(scheduleDate) {
    const today = (0, moment_timezone_1.default)().startOf("day");
    const target = (0, moment_timezone_1.default)(scheduleDate, "YYYY-MM-DD").startOf("day");
    // Descobre o domingo do fim de semana alvo
    const targetSunday = target.clone().isoWeekday(7);
    // Descobre o domingo atual (do fim de semana de hoje)
    const currentSunday = today.isoWeekday() === 7
        ? today.clone() // Domingo: hoje ainda é parte do fim de semana atual
        : today.clone().isoWeekday(7); // Outros dias: domingo da mesma semana ISO
    return targetSunday.isSame(currentSunday, "day");
}
exports.isCurrentWeekend = isCurrentWeekend;
