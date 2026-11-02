"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyMinistryController = void 0;
const permissions_1 = require("../../middlewares/permissions");
const userRepository_1 = require("../../repositories/userRepository");
const publisherFieldActivityRepository_1 = require("../../repositories/publisherFieldActivityRepository");
const publisherBibleStudentRepository_1 = require("../../repositories/publisherBibleStudentRepository");
const publisherMonthBalanceRepository_1 = require("../../repositories/publisherMonthBalanceRepository");
const reportRepository_1 = require("../../repositories/reportRepository");
const totalsReportRepository_1 = require("../../repositories/totalsReportRepository");
const api_errors_1 = require("../../helpers/api-errors");
const enumWeekDays_1 = require("../../types/enumWeekDays");
const Report_1 = require("../../entities/Report");
const typeorm_1 = require("typeorm");
const dayjs_1 = __importDefault(require("dayjs"));
class DailyMinistryController {
    // Helper privado para obter o publicador logado
    static async getLoggedPublisher(req) {
        const userLogged = await (0, permissions_1.decoder)(req);
        const user = await userRepository_1.userRepository.findOne({
            where: { id: userLogged.id },
            relations: ["publisher", "publisher.congregation", "publisher.group"]
        });
        if (!user)
            throw new api_errors_1.NotFoundError("Usuário não encontrado");
        if (!user.publisher)
            throw new api_errors_1.BadRequestError("Você ainda não está vinculado a um publicador");
        return user.publisher;
    }
    // Helper privado para verificar se o mês da congregação foi fechado pelo secretário ou por prazo expirado
    static async assertMonthNotLocked(publisher, year, month) {
        var _a;
        const targetYear = String(year);
        const targetMonth = String(month).padStart(2, "0");
        const startOfTargetMonth = (0, dayjs_1.default)(`${targetYear}-${targetMonth}-01`);
        // Prazo limite: dia 20 do mês seguinte às 23:59:59
        const deadline = startOfTargetMonth.add(1, "month").date(20).endOf("day");
        const now = (0, dayjs_1.default)();
        if (now.isAfter(deadline)) {
            throw new api_errors_1.BadRequestError(`O prazo para registrar ou alterar o relatório de ${startOfTargetMonth.format("MM/YYYY")} encerrou no dia 20 (os relatórios da congregação já foram enviados). Fale com o secretário caso precise de ajustes.`);
        }
        // Verifica se o secretário da congregação já registrou os totais do mês para Betel
        if ((_a = publisher === null || publisher === void 0 ? void 0 : publisher.congregation) === null || _a === void 0 ? void 0 : _a.id) {
            const monthNamesEnum = [
                enumWeekDays_1.Months.JANEIRO, enumWeekDays_1.Months.FEVEREIRO, enumWeekDays_1.Months.MARCO, enumWeekDays_1.Months.ABRIL,
                enumWeekDays_1.Months.MAIO, enumWeekDays_1.Months.JUNHO, enumWeekDays_1.Months.JULHO, enumWeekDays_1.Months.AGOSTO,
                enumWeekDays_1.Months.SETEMBRO, enumWeekDays_1.Months.OUTUBRO, enumWeekDays_1.Months.NOVEMBRO, enumWeekDays_1.Months.DEZEMBRO
            ];
            const monthIndex = parseInt(targetMonth, 10) - 1;
            const monthEnum = monthNamesEnum[monthIndex];
            if (monthEnum) {
                const totals = await totalsReportRepository_1.totalsReportsRepository.findOne({
                    where: {
                        congregation: { id: publisher.congregation.id },
                        month: monthEnum,
                        year: targetYear
                    }
                });
                if (totals) {
                    throw new api_errors_1.BadRequestError(`O relatório de ${startOfTargetMonth.format("MM/YYYY")} já foi fechado pelo secretário da congregação. Para qualquer alteração, fale diretamente com o secretário.`);
                }
            }
        }
    }
    /* =========================================================
     *  ESTUDANTES BÍBLICOS
     * ========================================================= */
    // Listar estudantes do publicador
    async getStudents(req, res) {
        const publisher = await DailyMinistryController.getLoggedPublisher(req);
        const students = await publisherBibleStudentRepository_1.publisherBibleStudentRepository.find({
            where: { publisher_id: publisher.id },
            order: { name: "ASC" }
        });
        return res.json(students);
    }
    // Criar estudante
    async createStudent(req, res) {
        const publisher = await DailyMinistryController.getLoggedPublisher(req);
        const { name } = req.body;
        if (!name || typeof name !== "string" || !name.trim()) {
            throw new api_errors_1.BadRequestError("Nome do estudante é obrigatório");
        }
        const student = publisherBibleStudentRepository_1.publisherBibleStudentRepository.create({
            publisher_id: publisher.id,
            name: name.trim(),
            active: true
        });
        await publisherBibleStudentRepository_1.publisherBibleStudentRepository.save(student);
        return res.status(201).json(student);
    }
    // Atualizar estudante (nome / ativo)
    async updateStudent(req, res) {
        const publisher = await DailyMinistryController.getLoggedPublisher(req);
        const { student_id } = req.params;
        const { name, active } = req.body;
        const student = await publisherBibleStudentRepository_1.publisherBibleStudentRepository.findOne({
            where: { id: student_id, publisher_id: publisher.id }
        });
        if (!student)
            throw new api_errors_1.NotFoundError("Estudante não encontrado");
        if (name !== undefined) {
            if (!name || typeof name !== "string" || !name.trim()) {
                throw new api_errors_1.BadRequestError("Nome inválido");
            }
            student.name = name.trim();
        }
        if (active !== undefined) {
            student.active = Boolean(active);
        }
        await publisherBibleStudentRepository_1.publisherBibleStudentRepository.save(student);
        return res.json(student);
    }
    // Excluir estudante
    async deleteStudent(req, res) {
        const publisher = await DailyMinistryController.getLoggedPublisher(req);
        const { student_id } = req.params;
        const student = await publisherBibleStudentRepository_1.publisherBibleStudentRepository.findOne({
            where: { id: student_id, publisher_id: publisher.id }
        });
        if (!student)
            throw new api_errors_1.NotFoundError("Estudante não encontrado");
        await publisherBibleStudentRepository_1.publisherBibleStudentRepository.remove(student);
        return res.status(204).send();
    }
    /* =========================================================
     *  ATIVIDADES DIÁRIAS (MINISTÉRIO)
     * ========================================================= */
    // Obter mês atual e atividades de um determinado mês (YYYY-MM)
    async getMonthActivities(req, res) {
        var _a;
        const publisher = await DailyMinistryController.getLoggedPublisher(req);
        const { year, month } = req.query; // Ex: year=2026, month=11 ou month=11/2026
        const targetYear = String(year || (0, dayjs_1.default)().format("YYYY"));
        const targetMonth = String(month || (0, dayjs_1.default)().format("MM")).padStart(2, "0");
        const startOfMonth = `${targetYear}-${targetMonth}-01`;
        const endOfMonth = (0, dayjs_1.default)(startOfMonth).endOf("month").format("YYYY-MM-DD");
        const activities = await publisherFieldActivityRepository_1.publisherFieldActivityRepository.find({
            where: {
                publisher_id: publisher.id,
                date: (0, typeorm_1.Between)(startOfMonth, endOfMonth)
            },
            relations: ["bibleStudent"],
            order: { date: "ASC", created_at: "ASC" }
        });
        // Buscar saldo de minutos do mês
        let monthBalance = await publisherMonthBalanceRepository_1.publisherMonthBalanceRepository.findOne({
            where: {
                publisher_id: publisher.id,
                year: targetYear,
                month: targetMonth
            }
        });
        // Se não tiver saldo desse mês, busca se o mês anterior enviou saldo para este
        if (!monthBalance) {
            const prevDate = (0, dayjs_1.default)(startOfMonth).subtract(1, "month");
            const prevMonth = prevDate.format("MM");
            const prevYear = prevDate.format("YYYY");
            const prevBalance = await publisherMonthBalanceRepository_1.publisherMonthBalanceRepository.findOne({
                where: {
                    publisher_id: publisher.id,
                    year: prevYear,
                    month: prevMonth
                }
            });
            monthBalance = publisherMonthBalanceRepository_1.publisherMonthBalanceRepository.create({
                publisher_id: publisher.id,
                year: targetYear,
                month: targetMonth,
                transferred_minutes_in: (prevBalance === null || prevBalance === void 0 ? void 0 : prevBalance.transferred_minutes_out) || 0,
                transferred_minutes_out: 0,
                is_closed: false
            });
        }
        // Buscar todos os estudantes cadastrados pelo publicador
        const publisherStudents = await publisherBibleStudentRepository_1.publisherBibleStudentRepository.find({
            where: { publisher_id: publisher.id }
        });
        const studentsMap = new Map(publisherStudents.map(s => [s.id, s]));
        // Resumo
        let totalMinistryMinutes = 0;
        let totalCreditMinutes = 0;
        const studentsSet = new Set();
        activities.forEach(act => {
            totalMinistryMinutes += Number(act.minutes || 0);
            totalCreditMinutes += Number(act.credit_minutes || 0);
            const ids = [];
            if (act.bible_student_ids && Array.isArray(act.bible_student_ids)) {
                ids.push(...act.bible_student_ids);
            }
            else if (typeof act.bible_student_ids === "string" && act.bible_student_ids.trim()) {
                ids.push(...act.bible_student_ids.split(","));
            }
            else if (act.bible_student_id) {
                ids.push(act.bible_student_id);
            }
            const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
            act.bible_student_ids = uniqueIds;
            act.bibleStudents = uniqueIds.map(id => studentsMap.get(id)).filter(Boolean);
            if (!act.bibleStudent && act.bibleStudents.length > 0) {
                act.bibleStudent = act.bibleStudents[0];
            }
            uniqueIds.forEach(id => studentsSet.add(id));
        });
        const studentsWithStudies = Array.from(studentsSet)
            .map(id => studentsMap.get(id))
            .filter(Boolean)
            .map(s => ({ id: s.id, name: s.name }));
        const startOfTargetMonth = (0, dayjs_1.default)(`${targetYear}-${targetMonth}-01`);
        const deadline = startOfTargetMonth.add(1, "month").date(20).endOf("day");
        const isExpired = (0, dayjs_1.default)().isAfter(deadline);
        let isClosedBySecretary = false;
        if ((_a = publisher.congregation) === null || _a === void 0 ? void 0 : _a.id) {
            const monthNamesEnum = [
                enumWeekDays_1.Months.JANEIRO, enumWeekDays_1.Months.FEVEREIRO, enumWeekDays_1.Months.MARCO, enumWeekDays_1.Months.ABRIL,
                enumWeekDays_1.Months.MAIO, enumWeekDays_1.Months.JUNHO, enumWeekDays_1.Months.JULHO, enumWeekDays_1.Months.AGOSTO,
                enumWeekDays_1.Months.SETEMBRO, enumWeekDays_1.Months.OUTUBRO, enumWeekDays_1.Months.NOVEMBRO, enumWeekDays_1.Months.DEZEMBRO
            ];
            const monthIndex = parseInt(targetMonth, 10) - 1;
            const monthEnum = monthNamesEnum[monthIndex];
            if (monthEnum) {
                const totals = await totalsReportRepository_1.totalsReportsRepository.findOne({
                    where: {
                        congregation: { id: publisher.congregation.id },
                        month: monthEnum,
                        year: targetYear
                    }
                });
                isClosedBySecretary = Boolean(totals);
            }
        }
        const isLocked = isClosedBySecretary || isExpired;
        const isMyReportSubmitted = Boolean(monthBalance === null || monthBalance === void 0 ? void 0 : monthBalance.is_closed);
        const lockReason = isClosedBySecretary ? "closed_by_secretary" : isExpired ? "expired" : null;
        return res.json({
            year: targetYear,
            month: targetMonth,
            activities,
            balance: monthBalance,
            studentsWithStudies,
            isLocked,
            isClosedBySecretary,
            isExpired,
            isMyReportSubmitted,
            lockReason,
            deadlineDate: deadline.format("YYYY-MM-DD"),
            summary: {
                transferredMinutesIn: monthBalance.transferred_minutes_in || 0,
                totalMinistryMinutes,
                totalCreditMinutes,
                totalMinutesOverall: totalMinistryMinutes + totalCreditMinutes + (monthBalance.transferred_minutes_in || 0),
                totalStudiesCount: studentsSet.size
            }
        });
    }
    // Criar uma nova atividade diária
    async createActivity(req, res) {
        const publisher = await DailyMinistryController.getLoggedPublisher(req);
        const { date, minutes, credit_minutes, credit_description, notes, bible_student_id, bible_student_ids } = req.body;
        if (!date)
            throw new api_errors_1.BadRequestError("A data da atividade é obrigatória");
        const parsedDate = (0, dayjs_1.default)(date).format("YYYY-MM-DD");
        const actYear = (0, dayjs_1.default)(parsedDate).format("YYYY");
        const actMonth = (0, dayjs_1.default)(parsedDate).format("MM");
        await DailyMinistryController.assertMonthNotLocked(publisher, actYear, actMonth);
        const actMinutes = Math.max(0, parseInt(minutes, 10) || 0);
        const credMinutes = Math.max(0, parseInt(credit_minutes, 10) || 0);
        let studentIds = [];
        if (Array.isArray(bible_student_ids)) {
            studentIds = bible_student_ids.filter((id) => typeof id === "string" && id.trim().length > 0);
        }
        else if (bible_student_id) {
            studentIds = [bible_student_id];
        }
        if (actMinutes === 0 && credMinutes === 0 && studentIds.length === 0) {
            throw new api_errors_1.BadRequestError("Informe o tempo de campo, crédito ou pelo menos um estudo realizado");
        }
        const activity = publisherFieldActivityRepository_1.publisherFieldActivityRepository.create({
            publisher_id: publisher.id,
            date: parsedDate,
            minutes: actMinutes,
            credit_minutes: credMinutes,
            credit_description: (credit_description === null || credit_description === void 0 ? void 0 : credit_description.trim()) || null,
            notes: (notes === null || notes === void 0 ? void 0 : notes.trim()) || null,
            bible_student_id: studentIds.length > 0 ? studentIds[0] : null,
            bible_student_ids: studentIds
        });
        await publisherFieldActivityRepository_1.publisherFieldActivityRepository.save(activity);
        return res.status(201).json(activity);
    }
    // Atualizar uma atividade
    async updateActivity(req, res) {
        const publisher = await DailyMinistryController.getLoggedPublisher(req);
        const { activity_id } = req.params;
        const { date, minutes, credit_minutes, credit_description, notes, bible_student_id, bible_student_ids } = req.body;
        const activity = await publisherFieldActivityRepository_1.publisherFieldActivityRepository.findOne({
            where: { id: activity_id, publisher_id: publisher.id }
        });
        if (!activity)
            throw new api_errors_1.NotFoundError("Atividade não encontrada");
        const oldYear = (0, dayjs_1.default)(activity.date).format("YYYY");
        const oldMonth = (0, dayjs_1.default)(activity.date).format("MM");
        await DailyMinistryController.assertMonthNotLocked(publisher, oldYear, oldMonth);
        if (date !== undefined) {
            const newYear = (0, dayjs_1.default)(date).format("YYYY");
            const newMonth = (0, dayjs_1.default)(date).format("MM");
            if (newYear !== oldYear || newMonth !== oldMonth) {
                await DailyMinistryController.assertMonthNotLocked(publisher, newYear, newMonth);
            }
            activity.date = (0, dayjs_1.default)(date).format("YYYY-MM-DD");
        }
        if (minutes !== undefined)
            activity.minutes = Math.max(0, parseInt(minutes, 10) || 0);
        if (credit_minutes !== undefined)
            activity.credit_minutes = Math.max(0, parseInt(credit_minutes, 10) || 0);
        if (credit_description !== undefined)
            activity.credit_description = (credit_description === null || credit_description === void 0 ? void 0 : credit_description.trim()) || null;
        if (notes !== undefined)
            activity.notes = (notes === null || notes === void 0 ? void 0 : notes.trim()) || null;
        if (bible_student_ids !== undefined) {
            const studentIds = Array.isArray(bible_student_ids)
                ? bible_student_ids.filter((id) => typeof id === "string" && id.trim().length > 0)
                : [];
            activity.bible_student_ids = studentIds;
            activity.bible_student_id = studentIds.length > 0 ? studentIds[0] : null;
        }
        else if (bible_student_id !== undefined) {
            if (bible_student_id) {
                activity.bible_student_id = bible_student_id;
                activity.bible_student_ids = [bible_student_id];
            }
            else {
                activity.bible_student_id = null;
                activity.bible_student_ids = [];
            }
        }
        await publisherFieldActivityRepository_1.publisherFieldActivityRepository.save(activity);
        return res.json(activity);
    }
    // Excluir atividade
    async deleteActivity(req, res) {
        const publisher = await DailyMinistryController.getLoggedPublisher(req);
        const { activity_id } = req.params;
        const activity = await publisherFieldActivityRepository_1.publisherFieldActivityRepository.findOne({
            where: { id: activity_id, publisher_id: publisher.id }
        });
        if (!activity)
            throw new api_errors_1.NotFoundError("Atividade não encontrada");
        const actYear = (0, dayjs_1.default)(activity.date).format("YYYY");
        const actMonth = (0, dayjs_1.default)(activity.date).format("MM");
        await DailyMinistryController.assertMonthNotLocked(publisher, actYear, actMonth);
        await publisherFieldActivityRepository_1.publisherFieldActivityRepository.remove(activity);
        return res.status(204).send();
    }
    /* =========================================================
     *  FECHAMENTO E ENVIO DO RELATÓRIO MENSAL
     * ========================================================= */
    // Submeter relatório final do mês
    async submitMonthReport(req, res) {
        var _a, _b;
        const publisher = await DailyMinistryController.getLoggedPublisher(req);
        const { year, month, // '01' a '12' ou nome
        hours, // horas finais calculadas / informadas
        studies, // quantidade de estudos final escolhida pelo usuário
        observations, // observações (crédito de horas etc)
        minutesHandling, // 'transfer' | 'round_up' | 'round_down'
        leftoverMinutes // minutos que sobraram
         } = req.body;
        if (!year || !month)
            throw new api_errors_1.BadRequestError("Ano e mês são obrigatórios");
        const targetYear = String(year);
        const targetMonth = String(month).padStart(2, "0");
        await DailyMinistryController.assertMonthNotLocked(publisher, targetYear, targetMonth);
        // Obter nome do enum Months para salvar na tabela Report
        const monthIndex = parseInt(targetMonth, 10) - 1;
        const monthNamesEnum = [
            enumWeekDays_1.Months.JANEIRO, enumWeekDays_1.Months.FEVEREIRO, enumWeekDays_1.Months.MARCO, enumWeekDays_1.Months.ABRIL,
            enumWeekDays_1.Months.MAIO, enumWeekDays_1.Months.JUNHO, enumWeekDays_1.Months.JULHO, enumWeekDays_1.Months.AGOSTO,
            enumWeekDays_1.Months.SETEMBRO, enumWeekDays_1.Months.OUTUBRO, enumWeekDays_1.Months.NOVEMBRO, enumWeekDays_1.Months.DEZEMBRO
        ];
        const monthEnum = monthNamesEnum[monthIndex] || enumWeekDays_1.Months.JANEIRO;
        // 1. Atualizar ou criar o PublisherMonthBalance
        let balance = await publisherMonthBalanceRepository_1.publisherMonthBalanceRepository.findOne({
            where: {
                publisher_id: publisher.id,
                year: targetYear,
                month: targetMonth
            }
        });
        if (!balance) {
            balance = publisherMonthBalanceRepository_1.publisherMonthBalanceRepository.create({
                publisher_id: publisher.id,
                year: targetYear,
                month: targetMonth
            });
        }
        const remaining = Math.max(0, parseInt(leftoverMinutes, 10) || 0);
        if (minutesHandling === "transfer") {
            balance.transferred_minutes_out = remaining;
            // Já atualiza ou cria o saldo inicial do mês seguinte!
            const nextDate = (0, dayjs_1.default)(`${targetYear}-${targetMonth}-01`).add(1, "month");
            const nextYear = nextDate.format("YYYY");
            const nextMonth = nextDate.format("MM");
            let nextBalance = await publisherMonthBalanceRepository_1.publisherMonthBalanceRepository.findOne({
                where: {
                    publisher_id: publisher.id,
                    year: nextYear,
                    month: nextMonth
                }
            });
            if (!nextBalance) {
                nextBalance = publisherMonthBalanceRepository_1.publisherMonthBalanceRepository.create({
                    publisher_id: publisher.id,
                    year: nextYear,
                    month: nextMonth,
                    transferred_minutes_in: remaining,
                    transferred_minutes_out: 0,
                    is_closed: false
                });
            }
            else {
                nextBalance.transferred_minutes_in = remaining;
            }
            await publisherMonthBalanceRepository_1.publisherMonthBalanceRepository.save(nextBalance);
        }
        else {
            balance.transferred_minutes_out = 0;
        }
        balance.is_closed = true;
        await publisherMonthBalanceRepository_1.publisherMonthBalanceRepository.save(balance);
        // 2. Salvar na tabela oficial Report da congregação
        let report = await reportRepository_1.reportRepository.findOne({
            where: {
                publisher: { id: publisher.id },
                month: monthEnum,
                year: targetYear
            }
        });
        const finalHours = Math.max(0, parseInt(hours, 10) || 0);
        const finalStudies = studies !== undefined && studies !== null && studies !== ""
            ? Math.max(0, parseInt(studies, 10) || 0)
            : 0;
        if (!report) {
            report = new Report_1.Report();
            report.publisher = publisher;
            report.month = monthEnum;
            report.year = targetYear;
            report.hours = finalHours;
            report.studies = finalStudies;
            report.observations = (observations === null || observations === void 0 ? void 0 : observations.trim()) || "";
            report.group = ((_a = publisher.group) === null || _a === void 0 ? void 0 : _a.name) || "";
            report.privileges = publisher.privileges || [];
        }
        else {
            report.hours = finalHours;
            report.studies = finalStudies;
            report.observations = (observations === null || observations === void 0 ? void 0 : observations.trim()) || "";
            if ((_b = publisher.group) === null || _b === void 0 ? void 0 : _b.name)
                report.group = publisher.group.name;
        }
        await reportRepository_1.reportRepository.save(report);
        return res.json({
            message: "Relatório enviado com sucesso!",
            report,
            balance
        });
    }
}
exports.DailyMinistryController = DailyMinistryController;
