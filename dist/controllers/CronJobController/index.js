"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const noticeRepository_1 = require("../../repositories/noticeRepository");
const typeorm_1 = require("typeorm");
const api_errors_1 = require("../../helpers/api-errors");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const reportRepository_1 = require("../../repositories/reportRepository");
const getMonths_1 = require("../../functions/getMonths");
const meetingAssistanceRepository_1 = require("../../repositories/meetingAssistanceRepository");
//@ts-expect-error
const mailer_1 = __importDefault(require("../../modules/mailer"));
const child_process_1 = require("child_process");
const config_1 = require("../../config");
const cleaningScheduleRepository_1 = require("../../repositories/cleaningScheduleRepository");
const dayjs_1 = __importDefault(require("dayjs"));
const cleaningExceptionRepository_1 = require("../../repositories/cleaningExceptionRepository");
const fieldServiceTemplateLocationOverrideRepository_1 = require("../../repositories/fieldServiceTemplateLocationOverrideRepository");
const territoryHistoryRepository_1 = require("../../repositories/territoryHistoryRepository");
const fieldServiceScheduleRepository_1 = require("../../repositories/fieldServiceScheduleRepository");
const fieldServiceExceptionRepository_1 = require("../../repositories/fieldServiceExceptionRepository");
const publisherReminderRepository_1 = require("../../repositories/publisherReminderRepository");
class CronJobController {
    async deleteExpiredNotices(req, res) {
        const startOfToday = (0, moment_timezone_1.default)().startOf('day').toDate();
        const expiredNotices = await noticeRepository_1.noticeRepository.find({
            where: {
                expired: (0, typeorm_1.LessThan)(startOfToday)
            }
        });
        if (expiredNotices.length === 0) {
            throw new api_errors_1.NotFoundError("No expired notices found");
        }
        try {
            await noticeRepository_1.noticeRepository.remove(expiredNotices);
            return res.status(200).json({ message: "Expired notices deleted", notices: expiredNotices });
        }
        catch (error) {
            console.log(error);
            throw new Error("Error deleting expired notices");
        }
    }
    async cleanOldPublisherReminders(req, res) {
        var _a;
        const today = (0, dayjs_1.default)().startOf("day").format("YYYY-MM-DD");
        try {
            const result = await publisherReminderRepository_1.publisherReminderRepository.delete({
                isRecurring: false,
                endDate: (0, typeorm_1.And)((0, typeorm_1.Not)((0, typeorm_1.IsNull)()), (0, typeorm_1.LessThan)(today))
            });
            const deleted = (_a = result.affected) !== null && _a !== void 0 ? _a : 0;
            return res.json({
                message: "Old publisher reminders cleaned",
                deleted
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Error cleaning old publisher reminders",
                error: error.message
            });
        }
    }
    async reportsCleanUp(req, res) {
        const monthsListReports = (0, getMonths_1.getMonthsOld)(3);
        const monthsListMeetingAssistance = (0, getMonths_1.getMonthsOld)(4);
        const reports = await reportRepository_1.reportRepository.find();
        const meetingAssistance = await meetingAssistanceRepository_1.meetingAssistanceRepository.find();
        const filterMeetingAssistance = meetingAssistance.filter(meet => {
            const meetingAssitance = `${meet.month.toLowerCase()} ${meet.year}`;
            return monthsListMeetingAssistance.includes(meetingAssitance);
        });
        const filterReports = reports.filter(report => {
            const reportMonthYear = `${report.month.toLowerCase()} ${report.year}`;
            return monthsListReports.includes(reportMonthYear);
        });
        if (filterMeetingAssistance.length > 0) {
            console.log(`${filterMeetingAssistance.length} Meeting Assistance records were deleted`);
            await meetingAssistanceRepository_1.meetingAssistanceRepository.remove(filterMeetingAssistance);
        }
        if (filterReports.length > 0) {
            console.log(`${filterReports.length} Reports records were deleted`);
            await reportRepository_1.reportRepository.remove(filterReports);
        }
        res.send();
    }
    async backup(req, res) {
        const dateNow = (0, moment_timezone_1.default)().format("DD/MM/YYYY");
        const dumpCommand = `pg_dump -U ${config_1.config.db_user} -h ${config_1.config.db_host} -p ${config_1.config.db_port} -d ${config_1.config.db_name}`;
        const child = (0, child_process_1.exec)(dumpCommand, {
            maxBuffer: 1024 * 1024 * 10,
            env: { ...process.env, PGPASSWORD: config_1.config.db_pass },
        }, (error, stdout, stderr) => {
            if (error) {
                console.error('Error executing pg_dump command:', error);
                return res.status(500).send({ message: 'Error executing database dump' });
            }
            if (stderr) {
                console.error('pg_dump stderr:', stderr);
            }
            // Send the email with the backup after capturing stdout
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: config_1.config.email_backup,
                subject: 'Database Backup',
                text: 'Attached is the database backup.',
                template: "backup/index",
                attachments: [
                    {
                        filename: `${dateNow} backup.sql`,
                        content: stdout, // Attach the captured stdout directly as content
                    },
                ],
            };
            mailer_1.default.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.error('Error sending email:', err);
                    return res.status(500).send({ message: "Error sending email" });
                }
                console.log('Email sent:', info.response);
                res.send({ message: 'Backup successfully emailed' });
            });
        });
    }
    async cleanTerritoryHistory(req, res) {
        try {
            const histories = await territoryHistoryRepository_1.territoryHistoryRepository.find({
                where: {
                    completion_date: (0, typeorm_1.Not)((0, typeorm_1.IsNull)())
                },
                relations: ["territory"],
                order: {
                    completion_date: "DESC"
                }
            });
            const grouped = {};
            for (const history of histories) {
                const territoryId = history.territory.id;
                if (!grouped[territoryId]) {
                    grouped[territoryId] = [];
                }
                grouped[territoryId].push(history);
            }
            const toDelete = [];
            for (const territoryId in grouped) {
                const records = grouped[territoryId];
                if (records.length > 4) {
                    const excess = records.slice(4);
                    toDelete.push(...excess);
                }
            }
            if (toDelete.length > 0) {
                await territoryHistoryRepository_1.territoryHistoryRepository.remove(toDelete);
            }
            const deleted = toDelete.length;
            await mailer_1.default.sendMail({
                from: process.env.EMAIL_USER,
                to: config_1.config.email_backup,
                subject: "🧹 Limpeza de histórico de territórios concluída",
                template: "cleanup/territoryHistory",
                context: {
                    deleted
                }
            });
            return res.json({
                message: "Territory history cleanup completed",
                deleted
            });
        }
        catch (error) {
            console.error(error);
            await mailer_1.default.sendMail({
                from: process.env.EMAIL_USER,
                to: config_1.config.email_backup,
                subject: "❌ Falha na limpeza de histórico de territórios",
                template: "cleanup/error",
                context: {
                    error: error.message
                }
            });
            return res.status(500).json({
                message: "Error cleaning territory history",
                error: error.message
            });
        }
    }
    async cleanOldFieldService(req, res) {
        var _a, _b, _c;
        const overrideLimitDate = (0, dayjs_1.default)()
            .startOf("isoWeek")
            .format("YYYY-MM-DD");
        const scheduleLimitDate = (0, dayjs_1.default)()
            .subtract(6, "month")
            .format("YYYY-MM-DD");
        const exceptionLimitDate = (0, dayjs_1.default)()
            .subtract(1, "month")
            .format("YYYY-MM-DD");
        try {
            // limpa overrides antigos
            const overrideResult = await fieldServiceTemplateLocationOverrideRepository_1.fieldServiceTemplateLocationOverrideRepository.delete({
                week_start: (0, typeorm_1.LessThan)(overrideLimitDate)
            });
            // limpa programações antigas
            const schedulesResult = await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.delete({
                date: (0, typeorm_1.LessThan)(scheduleLimitDate)
            });
            // limpa exceções antigas
            const exceptionsResult = await fieldServiceExceptionRepository_1.fieldServiceExceptionRepository.delete({
                date: (0, typeorm_1.LessThan)(exceptionLimitDate)
            });
            const deletedOverrides = (_a = overrideResult.affected) !== null && _a !== void 0 ? _a : 0;
            const deletedSchedules = (_b = schedulesResult.affected) !== null && _b !== void 0 ? _b : 0;
            const deletedExceptions = (_c = exceptionsResult.affected) !== null && _c !== void 0 ? _c : 0;
            await mailer_1.default.sendMail({
                from: process.env.EMAIL_USER,
                to: config_1.config.email_backup,
                subject: "🧹 Limpeza semanal de saída de campo",
                template: "cleanup/fieldService",
                context: {
                    deletedOverrides,
                    deletedSchedules,
                    deletedExceptions,
                    limitDateOverrides: overrideLimitDate,
                    limitDateSchedules: scheduleLimitDate,
                    limitDateExceptions: exceptionLimitDate
                }
            });
            return res.json({
                message: "Field service cleanup completed",
                deletedOverrides,
                deletedSchedules,
                deletedExceptions
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Error cleaning field service data",
                error: error.message
            });
        }
    }
    async cleanOldData(req, res) {
        var _a, _b;
        const scheduleLimitDate = (0, dayjs_1.default)().subtract(12, "month").format("YYYY-MM-DD");
        const exceptionLimitDate = (0, dayjs_1.default)().subtract(6, "month").format("YYYY-MM-DD");
        try {
            // Apaga schedules antigos
            const schedulesResult = await cleaningScheduleRepository_1.cleaningScheduleRepository.delete({
                date: (0, typeorm_1.LessThan)(scheduleLimitDate)
            });
            // Apaga exceptions antigas
            const exceptionsResult = await cleaningExceptionRepository_1.cleaningExceptionRepository.delete({
                date: (0, typeorm_1.LessThan)(exceptionLimitDate)
            });
            const deletedSchedules = (_a = schedulesResult.affected) !== null && _a !== void 0 ? _a : 0;
            const deletedExceptions = (_b = exceptionsResult.affected) !== null && _b !== void 0 ? _b : 0;
            await mailer_1.default.sendMail({
                from: process.env.EMAIL_USER,
                to: config_1.config.email_backup,
                subject: "🧹 Limpeza automática concluída",
                template: "cleanup/success",
                context: {
                    deletedSchedules,
                    deletedExceptions,
                    scheduleLimitDate,
                    exceptionLimitDate,
                }
            });
            return res.json({
                message: "Cleanup completed",
                deletedSchedules,
                deletedExceptions,
            });
        }
        catch (error) {
            console.error("Cleanup error:", error);
            await mailer_1.default.sendMail({
                from: process.env.EMAIL_USER,
                to: config_1.config.email_backup,
                subject: "❌ Falha na limpeza automática",
                template: "cleanup/error",
                context: {
                    error: error.message
                }
            });
            return res.status(500).json({
                message: "Error cleaning old data",
                error: error.message
            });
        }
    }
}
exports.default = new CronJobController();
