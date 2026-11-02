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
        // Resumo
        let totalMinistryMinutes = 0;
        let totalCreditMinutes = 0;
        const studentsSet = new Set();
        activities.forEach(act => {
            totalMinistryMinutes += Number(act.minutes || 0);
            totalCreditMinutes += Number(act.credit_minutes || 0);
            if (act.bible_student_id) {
                studentsSet.add(act.bible_student_id);
            }
        });
        return res.json({
            year: targetYear,
            month: targetMonth,
            activities,
            balance: monthBalance,
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
        const { date, minutes, credit_minutes, credit_description, notes, bible_student_id } = req.body;
        if (!date)
            throw new api_errors_1.BadRequestError("A data da atividade é obrigatória");
        const parsedDate = (0, dayjs_1.default)(date).format("YYYY-MM-DD");
        const actMinutes = Math.max(0, parseInt(minutes, 10) || 0);
        const credMinutes = Math.max(0, parseInt(credit_minutes, 10) || 0);
        if (actMinutes === 0 && credMinutes === 0 && !bible_student_id) {
            throw new api_errors_1.BadRequestError("Informe o tempo de campo, crédito ou um estudo realizado");
        }
        // Valida se o estudante pertence ao publicador caso informado
        if (bible_student_id) {
            const student = await publisherBibleStudentRepository_1.publisherBibleStudentRepository.findOne({
                where: { id: bible_student_id, publisher_id: publisher.id }
            });
            if (!student)
                throw new api_errors_1.BadRequestError("Estudante não encontrado");
        }
        const activity = publisherFieldActivityRepository_1.publisherFieldActivityRepository.create({
            publisher_id: publisher.id,
            date: parsedDate,
            minutes: actMinutes,
            credit_minutes: credMinutes,
            credit_description: (credit_description === null || credit_description === void 0 ? void 0 : credit_description.trim()) || null,
            notes: (notes === null || notes === void 0 ? void 0 : notes.trim()) || null,
            bible_student_id: bible_student_id || null
        });
        await publisherFieldActivityRepository_1.publisherFieldActivityRepository.save(activity);
        return res.status(201).json(activity);
    }
    // Atualizar uma atividade
    async updateActivity(req, res) {
        const publisher = await DailyMinistryController.getLoggedPublisher(req);
        const { activity_id } = req.params;
        const { date, minutes, credit_minutes, credit_description, notes, bible_student_id } = req.body;
        const activity = await publisherFieldActivityRepository_1.publisherFieldActivityRepository.findOne({
            where: { id: activity_id, publisher_id: publisher.id }
        });
        if (!activity)
            throw new api_errors_1.NotFoundError("Atividade não encontrada");
        if (date !== undefined)
            activity.date = (0, dayjs_1.default)(date).format("YYYY-MM-DD");
        if (minutes !== undefined)
            activity.minutes = Math.max(0, parseInt(minutes, 10) || 0);
        if (credit_minutes !== undefined)
            activity.credit_minutes = Math.max(0, parseInt(credit_minutes, 10) || 0);
        if (credit_description !== undefined)
            activity.credit_description = (credit_description === null || credit_description === void 0 ? void 0 : credit_description.trim()) || null;
        if (notes !== undefined)
            activity.notes = (notes === null || notes === void 0 ? void 0 : notes.trim()) || null;
        if (bible_student_id !== undefined) {
            if (bible_student_id) {
                const student = await publisherBibleStudentRepository_1.publisherBibleStudentRepository.findOne({
                    where: { id: bible_student_id, publisher_id: publisher.id }
                });
                if (!student)
                    throw new api_errors_1.BadRequestError("Estudante não encontrado");
                activity.bible_student_id = student.id;
            }
            else {
                activity.bible_student_id = null;
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
