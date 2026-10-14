"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePioneerMonthString = exports.getMonthDateRange = exports.PT_MONTH_NAMES = exports.MONTH_MAP_PT = exports.translatePrivilegesENtoPT = exports.translatePrivilegesPTToEN = exports.privilegePTtoEN = exports.privilegeENToPT = void 0;
exports.privilegeENToPT = {
    "Publisher": "Publicador",
    "Elder": "Ancião",
    "Ministerial Servant": "Servo Ministerial",
    "Regular Pioneer": "Pioneiro Regular",
    "Special Pioneer": "Pioneiro Especial",
    "Missionary Worldwide": "Missionário em Campo",
    "Continuous Auxiliary Pioneer": "Auxiliar por Tempo Indeterminado",
    "Auxiliary Pioneer": "Pioneiro Auxiliar",
    "Speaker": "Orador",
    "Reader": "Leitor",
    "Chairman": "Presidente",
    "Attendant": "Indicador",
    "Microphone Attendant": "Microfone Volante",
    "Public Witness": "Testemunho Público",
    "Sound": "Som",
    "Media": "Mídias",
    "Sound and Media": "Som e Mídias",
    "Stage": "Pedestal",
    "Stage Attendant": "Pedestal",
    "Field Conductor": "Dirigente de Campo"
};
exports.privilegePTtoEN = {
    "Publicador": "Publisher",
    "Ancião": "Elder",
    "Servo Ministerial": "Ministerial Servant",
    "Pioneiro Regular": "Regular Pioneer",
    "Pioneiro Especial": "Special Pioneer",
    "Missionário em Campo": "Missionary Worldwide",
    "Missionário": "Missionary Worldwide",
    "Missionario": "Missionary Worldwide",
    "Auxiliar por Tempo Indeterminado": "Continuous Auxiliary Pioneer",
    "Auxiliar Indeterminado": "Continuous Auxiliary Pioneer",
    "Pioneiro Auxiliar": "Auxiliary Pioneer",
    "Orador": "Speaker",
    "Leitor": "Reader",
    "Presidente": "Chairman",
    "Indicador": "Attendant",
    "Microfone Volante": "Microphone Attendant",
    "Dirigente de Campo": "Field Conductor",
    "Testemunho Público": "Public Witness",
    "Som": "Sound",
    "Mídias": "Media",
    "Som e Mídias": "Sound and Media",
    "Pedestal": "Stage Attendant"
};
function translatePrivilegesPTToEN(privileges) {
    return privileges.map(p => exports.privilegePTtoEN[p] || p);
}
exports.translatePrivilegesPTToEN = translatePrivilegesPTToEN;
function translatePrivilegesENtoPT(privileges) {
    return privileges.map(p => exports.privilegeENToPT[p] || p);
}
exports.translatePrivilegesENtoPT = translatePrivilegesENtoPT;
exports.MONTH_MAP_PT = {
    "janeiro": 0, "fevereiro": 1, "março": 2, "marco": 2, "abril": 3,
    "maio": 4, "junho": 5, "julho": 6, "agosto": 7, "setembro": 8,
    "outubro": 9, "novembro": 10, "dezembro": 11
};
exports.PT_MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];
function getMonthDateRange(monthStr, yearStr) {
    const cleanMonth = monthStr.trim().toLowerCase();
    const monthIndex = exports.MONTH_MAP_PT[cleanMonth];
    const year = typeof yearStr === 'number' ? yearStr : parseInt(yearStr.trim(), 10);
    if (monthIndex === undefined || isNaN(year))
        return null;
    const pad = (n) => n < 10 ? `0${n}` : `${n}`;
    const startDate = `${year}-${pad(monthIndex + 1)}-01`;
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    const endDate = `${year}-${pad(monthIndex + 1)}-${pad(lastDay)}`;
    return { startDate, endDate, monthIndex };
}
exports.getMonthDateRange = getMonthDateRange;
function parsePioneerMonthString(pioneerMonth) {
    const parts = pioneerMonth.split("-");
    if (parts.length < 2)
        return null;
    return getMonthDateRange(parts[0], parts[1]);
}
exports.parsePioneerMonthString = parsePioneerMonthString;
