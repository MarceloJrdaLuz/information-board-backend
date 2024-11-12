"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthsOld = void 0;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
function getMonthsOld(qntYearAgo) {
    moment_timezone_1.default.locale('pt-br');
    const dateNow = (0, moment_timezone_1.default)();
    const currentYear = dateNow.month() >= 8 ? dateNow.year() + 1 : dateNow.year(); //Ano corrente
    // Definir o mês de setembro de dois anos atrás (ano corrente de 2 anos atrás)
    const septemberTwoYearsAgo = (0, moment_timezone_1.default)(`09-01-${currentYear - qntYearAgo}`, 'MM-DD-YYYY'); // Setembro de dois anos atrás
    // Definir o mês de agosto do ano de serviço
    const augustNextYear = septemberTwoYearsAgo.clone().add(1, 'year').month(7).endOf('month');
    const monthsList = [];
    let monthNow = septemberTwoYearsAgo.clone();
    // Percorrer os meses de setembro até agosto, até o intervalo final
    while (monthNow.isBefore(augustNextYear) || monthNow.isSame(augustNextYear, 'month')) {
        const monthYearLabel = monthNow.format('MMMM YYYY');
        // Verificar se o mês pertence ao ano de serviço a ser excluido
        const yearLabel = monthNow.year();
        // Adicionar o mês à lista se não for do ano de serviço atual nem do anterior
        if (yearLabel !== currentYear && yearLabel !== (currentYear - 1)) {
            monthsList.push(monthYearLabel);
        }
        monthNow.add(1, 'month');
    }
    return monthsList;
}
exports.getMonthsOld = getMonthsOld;
