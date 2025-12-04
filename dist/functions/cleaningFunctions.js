"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertMeetingDayPortugueseToIso = exports.endweekDayMap = exports.midweekDayMap = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const isoWeek_1 = __importDefault(require("dayjs/plugin/isoWeek"));
dayjs_1.default.extend(isoWeek_1.default);
exports.midweekDayMap = {
    "Segunda-feira": 1,
    "Terça-feira": 2,
    "Quarta-feira": 3,
    "Quinta-feira": 4,
    "Sexta-feira": 5,
};
exports.endweekDayMap = {
    "Sexta-feira": 5,
    "Sábado": 6,
    "Domingo": 7,
};
function convertMeetingDayPortugueseToIso(day) {
    var _a, _b;
    return (_b = (_a = exports.midweekDayMap[day]) !== null && _a !== void 0 ? _a : exports.endweekDayMap[day]) !== null && _b !== void 0 ? _b : 1;
}
exports.convertMeetingDayPortugueseToIso = convertMeetingDayPortugueseToIso;
