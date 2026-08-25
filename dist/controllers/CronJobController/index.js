"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const typeorm_1 = require("typeorm");
const getMonths_1 = require("../../functions/getMonths");
const meetingAssistanceRepository_1 = require("../../repositories/meetingAssistanceRepository");
const noticeRepository_1 = require("../../repositories/noticeRepository");
const reportRepository_1 = require("../../repositories/reportRepository");
const child_process_1 = require("child_process");
const dayjs_1 = __importDefault(require("dayjs"));
const config_1 = require("../../config");
const Notification_1 = require("../../entities/Notification");
const resolveReminderOccurrence_1 = require("../../helpers/resolveReminderOccurrence");
//@ts-expect-error
const mailer_1 = __importDefault(require("../../modules/mailer"));
const cleaningExceptionRepository_1 = require("../../repositories/cleaningExceptionRepository");
const cleaningScheduleRepository_1 = require("../../repositories/cleaningScheduleRepository");
const externalTalkRepository_1 = require("../../repositories/externalTalkRepository");
const fieldServiceExceptionRepository_1 = require("../../repositories/fieldServiceExceptionRepository");
const fieldServiceScheduleRepository_1 = require("../../repositories/fieldServiceScheduleRepository");
const fieldServiceTemplateLocationOverrideRepository_1 = require("../../repositories/fieldServiceTemplateLocationOverrideRepository");
const hospitalityAssignmentRepository_1 = require("../../repositories/hospitalityAssignmentRepository");
const publicWitnessAssignmentRepository_1 = require("../../repositories/publicWitnessAssignmentRepository");
const publisherReminderRepository_1 = require("../../repositories/publisherReminderRepository");
const territoryHistoryRepository_1 = require("../../repositories/territoryHistoryRepository");
const weekendScheduleRepository_1 = require("../../repositories/weekendScheduleRepository");
const pushNotificationService_1 = require("../../services/pushNotificationService");
class CronJobController {
    async deleteExpiredNotices(req, res) {
        const startOfToday = (0, moment_timezone_1.default)().startOf("day").toDate();
        try {
            const expiredNotices = await noticeRepository_1.noticeRepository.find({
                where: {
                    expired: (0, typeorm_1.LessThan)(startOfToday),
                },
            });
            if (expiredNotices.length === 0) {
                return res.status(200).json({
                    message: "No expired notices found",
                    deleted: 0,
                });
            }
            await noticeRepository_1.noticeRepository.remove(expiredNotices);
            return res.status(200).json({
                message: "Expired notices deleted",
                deleted: expiredNotices.length,
                notices: expiredNotices,
            });
        }
        catch (error) {
            console.error(error);
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
    /**
     * Cron Job diário para disparar notificações push de lembretes pessoais e designações
     */
    async dispatchDailyNotifications(req, res) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1;
        const today = (0, dayjs_1.default)().startOf("day");
        const todayStr = today.format("YYYY-MM-DD");
        const tomorrow = today.add(1, "day");
        const tomorrowStr = tomorrow.format("YYYY-MM-DD");
        let notificationsSent = 0;
        const errors = [];
        try {
            // ==========================================
            // 1. LEMBRETES PESSOAIS DO DIA
            // ==========================================
            const activeReminders = await publisherReminderRepository_1.publisherReminderRepository.find({
                where: { isActive: true },
                relations: ["publisher"]
            });
            for (const reminder of activeReminders) {
                if (!reminder.publisher)
                    continue;
                const occurrence = (0, resolveReminderOccurrence_1.resolveReminderOccurrence)(reminder, today);
                if (occurrence) {
                    try {
                        const result = await pushNotificationService_1.pushNotificationService.sendToPublisher(reminder.publisher.id, {
                            title: `Lembrete: ${occurrence.title}`,
                            body: occurrence.description || "Você tem um lembrete pessoal agendado para hoje.",
                            type: Notification_1.NotificationType.REMINDER,
                            data: {
                                url: "/dashboard",
                                reminderId: reminder.id
                            }
                        });
                        if (result)
                            notificationsSent++;
                    }
                    catch (err) {
                        errors.push({ type: "REMINDER", reminderId: reminder.id, error: err.message });
                    }
                }
            }
            // ==========================================
            // 2. DESIGNAÇÕES DE REUNIÃO DE FIM DE SEMANA (Hoje e Amanhã)
            // ==========================================
            const weekendSchedules = await weekendScheduleRepository_1.weekendScheduleRepository.find({
                where: [
                    { date: todayStr },
                    { date: tomorrowStr }
                ],
                relations: ["chairman", "reader", "speaker", "speaker.publisher", "talk", "congregation"]
            });
            for (const s of weekendSchedules) {
                const isToday = s.date === todayStr;
                const timeLabel = isToday ? "hoje" : "amanhã";
                // Presidente
                if ((_a = s.chairman) === null || _a === void 0 ? void 0 : _a.id) {
                    try {
                        const result = await pushNotificationService_1.pushNotificationService.sendToPublisher(s.chairman.id, {
                            title: "Designação de Presidente",
                            body: `Você está designado como Presidente da Reunião ${timeLabel} (${(0, dayjs_1.default)(s.date).format("DD/MM")}).`,
                            type: Notification_1.NotificationType.CHAIRMAN,
                            data: { url: "/dashboard", date: s.date }
                        });
                        if (result)
                            notificationsSent++;
                    }
                    catch (err) {
                        errors.push({ type: "CHAIRMAN", error: err.message });
                    }
                }
                // Leitor
                if ((_b = s.reader) === null || _b === void 0 ? void 0 : _b.id) {
                    try {
                        const result = await pushNotificationService_1.pushNotificationService.sendToPublisher(s.reader.id, {
                            title: "Designação de Leitor",
                            body: `Você está designado como Leitor da revista A Sentinela ${timeLabel} (${(0, dayjs_1.default)(s.date).format("DD/MM")}).`,
                            type: Notification_1.NotificationType.READING,
                            data: { url: "/dashboard", date: s.date }
                        });
                        if (result)
                            notificationsSent++;
                    }
                    catch (err) {
                        errors.push({ type: "READING", error: err.message });
                    }
                }
                // Orador local
                if ((_d = (_c = s.speaker) === null || _c === void 0 ? void 0 : _c.publisher) === null || _d === void 0 ? void 0 : _d.id) {
                    try {
                        const talkTitle = ((_e = s.talk) === null || _e === void 0 ? void 0 : _e.title) ? ` - Tema: "${s.talk.title}"` : "";
                        const result = await pushNotificationService_1.pushNotificationService.sendToPublisher(s.speaker.publisher.id, {
                            title: "Designação de Orador",
                            body: `Você proferirá o discurso público ${timeLabel} (${(0, dayjs_1.default)(s.date).format("DD/MM")})${talkTitle}.`,
                            type: Notification_1.NotificationType.SPEAKER,
                            data: { url: "/dashboard", date: s.date }
                        });
                        if (result)
                            notificationsSent++;
                    }
                    catch (err) {
                        errors.push({ type: "SPEAKER", error: err.message });
                    }
                }
            }
            // ==========================================
            // 3. DESIGNAÇÕES DE LIMPEZA DO SALÃO (Hoje e Amanhã)
            // ==========================================
            const cleaningSchedules = await cleaningScheduleRepository_1.cleaningScheduleRepository.find({
                where: [
                    { date: todayStr },
                    { date: tomorrowStr }
                ],
                relations: ["group", "group.publishers"]
            });
            for (const c of cleaningSchedules) {
                const isToday = c.date === todayStr;
                const timeLabel = isToday ? "hoje" : "amanhã";
                const publishers = ((_f = c.group) === null || _f === void 0 ? void 0 : _f.publishers) || [];
                for (const pub of publishers) {
                    try {
                        const result = await pushNotificationService_1.pushNotificationService.sendToPublisher(pub.id, {
                            title: "Limpeza do Salão do Reino",
                            body: `Seu grupo (${((_g = c.group) === null || _g === void 0 ? void 0 : _g.name) || "Limpeza"}) está escalado para a limpeza do salão ${timeLabel} (${(0, dayjs_1.default)(c.date).format("DD/MM")}).`,
                            type: Notification_1.NotificationType.CLEANING,
                            data: { url: "/dashboard", date: c.date }
                        });
                        if (result)
                            notificationsSent++;
                    }
                    catch (err) {
                        errors.push({ type: "CLEANING", error: err.message });
                    }
                }
            }
            // ==========================================
            // 4. DESIGNAÇÕES DE SAÍDA DE CAMPO (Hoje e Amanhã)
            // ==========================================
            const fieldServiceSchedules = await fieldServiceScheduleRepository_1.fieldServiceScheduleRepository.find({
                where: [
                    { date: todayStr },
                    { date: tomorrowStr }
                ],
                relations: ["leader", "template"]
            });
            for (const fs of fieldServiceSchedules) {
                if ((_h = fs.leader) === null || _h === void 0 ? void 0 : _h.id) {
                    const isToday = fs.date === todayStr;
                    const timeLabel = isToday ? "hoje" : "amanhã";
                    const timeStr = ((_j = fs.template) === null || _j === void 0 ? void 0 : _j.time) ? ` às ${fs.template.time}` : "";
                    const locStr = ((_k = fs.template) === null || _k === void 0 ? void 0 : _k.location) ? ` (${fs.template.location})` : "";
                    try {
                        const result = await pushNotificationService_1.pushNotificationService.sendToPublisher(fs.leader.id, {
                            title: "Dirigente de Saída de Campo",
                            body: `Você está escalado como Dirigente de Campo ${timeLabel} (${(0, dayjs_1.default)(fs.date).format("DD/MM")})${timeStr}${locStr}.`,
                            type: Notification_1.NotificationType.FIELD_SERVICE,
                            data: { url: "/dashboard", date: fs.date }
                        });
                        if (result)
                            notificationsSent++;
                    }
                    catch (err) {
                        errors.push({ type: "FIELD_SERVICE", error: err.message });
                    }
                }
            }
            // ==========================================
            // 5. TESTEMUNHO PÚBLICO (Hoje e Amanhã)
            // ==========================================
            const publicWitnessAssignments = await publicWitnessAssignmentRepository_1.publicWitnessAssignmentRepository
                .createQueryBuilder("pw")
                .leftJoinAndSelect("pw.publishers", "allPublishers")
                .leftJoinAndSelect("allPublishers.publisher", "publisher")
                .leftJoinAndSelect("pw.timeSlot", "timeSlot")
                .leftJoinAndSelect("timeSlot.arrangement", "arrangement")
                .where("pw.date IN (:...dates)", { dates: [todayStr, tomorrowStr] })
                .getMany();
            for (const pw of publicWitnessAssignments) {
                const isToday = pw.date === todayStr;
                const timeLabel = isToday ? "hoje" : "amanhã";
                const title = ((_m = (_l = pw.timeSlot) === null || _l === void 0 ? void 0 : _l.arrangement) === null || _m === void 0 ? void 0 : _m.title) || "Testemunho Público";
                const period = pw.timeSlot ? ` (${pw.timeSlot.start_time} - ${pw.timeSlot.end_time})` : "";
                for (const pubRel of pw.publishers || []) {
                    if ((_o = pubRel.publisher) === null || _o === void 0 ? void 0 : _o.id) {
                        try {
                            const result = await pushNotificationService_1.pushNotificationService.sendToPublisher(pubRel.publisher.id, {
                                title: "Testemunho Público",
                                body: `Você tem designação no arranjo "${title}" ${timeLabel} (${(0, dayjs_1.default)(pw.date).format("DD/MM")})${period}.`,
                                type: Notification_1.NotificationType.PUBLICWITNESS,
                                data: { url: "/dashboard", date: pw.date }
                            });
                            if (result)
                                notificationsSent++;
                        }
                        catch (err) {
                            errors.push({ type: "PUBLICWITNESS", error: err.message });
                        }
                    }
                }
            }
            // ==========================================
            // 6. DISCURSOS EXTERNOS (Hoje e Amanhã)
            // ==========================================
            const externalTalks = await externalTalkRepository_1.externalTalkRepository.find({
                where: [
                    { date: todayStr },
                    { date: tomorrowStr }
                ],
                relations: ["speaker", "speaker.publisher", "destinationCongregation", "talk"]
            });
            for (const ext of externalTalks) {
                if ((_q = (_p = ext.speaker) === null || _p === void 0 ? void 0 : _p.publisher) === null || _q === void 0 ? void 0 : _q.id) {
                    const isToday = ext.date === todayStr;
                    const timeLabel = isToday ? "hoje" : "amanhã";
                    const cong = ((_r = ext.destinationCongregation) === null || _r === void 0 ? void 0 : _r.name) ? ` na congregação ${ext.destinationCongregation.name}` : "";
                    try {
                        const result = await pushNotificationService_1.pushNotificationService.sendToPublisher(ext.speaker.publisher.id, {
                            title: "Discurso Externo",
                            body: `Você tem discurso externo agendado ${timeLabel} (${(0, dayjs_1.default)(ext.date).format("DD/MM")})${cong}.`,
                            type: Notification_1.NotificationType.SPEAKER,
                            data: { url: "/dashboard", date: ext.date }
                        });
                        if (result)
                            notificationsSent++;
                    }
                    catch (err) {
                        errors.push({ type: "EXTERNAL_TALK", error: err.message });
                    }
                }
            }
            // ==========================================
            // 7. HOSPITALIDADE (Hoje e Amanhã)
            // ==========================================
            const hospitalityAssignments = await hospitalityAssignmentRepository_1.hospitalityAssignmentRepository.find({
                where: [
                    { weekend: { date: todayStr } },
                    { weekend: { date: tomorrowStr } }
                ],
                relations: ["group", "group.members", "group.host", "weekend"]
            });
            for (const h of hospitalityAssignments) {
                const isToday = ((_s = h.weekend) === null || _s === void 0 ? void 0 : _s.date) === todayStr;
                const timeLabel = isToday ? "hoje" : "amanhã";
                const dateFmt = (0, dayjs_1.default)((_t = h.weekend) === null || _t === void 0 ? void 0 : _t.date).format("DD/MM");
                // Host
                if ((_v = (_u = h.group) === null || _u === void 0 ? void 0 : _u.host) === null || _v === void 0 ? void 0 : _v.id) {
                    try {
                        const result = await pushNotificationService_1.pushNotificationService.sendToPublisher(h.group.host.id, {
                            title: "Arranjo de Hospitalidade",
                            body: `Você é o anfitrião do arranjo de hospitalidade ${timeLabel} (${dateFmt}).`,
                            type: Notification_1.NotificationType.HOSPITALITY,
                            data: { url: "/dashboard", date: (_w = h.weekend) === null || _w === void 0 ? void 0 : _w.date }
                        });
                        if (result)
                            notificationsSent++;
                    }
                    catch (err) {
                        errors.push({ type: "HOSPITALITY_HOST", error: err.message });
                    }
                }
                // Grupo
                for (const member of ((_x = h.group) === null || _x === void 0 ? void 0 : _x.members) || []) {
                    if (member.id !== ((_z = (_y = h.group) === null || _y === void 0 ? void 0 : _y.host) === null || _z === void 0 ? void 0 : _z.id)) {
                        try {
                            const result = await pushNotificationService_1.pushNotificationService.sendToPublisher(member.id, {
                                title: "Arranjo de Hospitalidade",
                                body: `Seu grupo (${((_0 = h.group) === null || _0 === void 0 ? void 0 : _0.name) || ""}) está designado para o arranjo de hospitalidade ${timeLabel} (${dateFmt}).`,
                                type: Notification_1.NotificationType.HOSPITALITY,
                                data: { url: "/dashboard", date: (_1 = h.weekend) === null || _1 === void 0 ? void 0 : _1.date }
                            });
                            if (result)
                                notificationsSent++;
                        }
                        catch (err) {
                            errors.push({ type: "HOSPITALITY_MEMBER", error: err.message });
                        }
                    }
                }
            }
            return res.json({
                message: "Daily notifications dispatched successfully",
                notificationsSent,
                errorsCount: errors.length,
                errors: errors.length > 0 ? errors : undefined,
            });
        }
        catch (error) {
            console.error("Error dispatching daily notifications:", error);
            return res.status(500).json({
                message: "Error dispatching daily notifications",
                error: error.message
            });
        }
    }
}
exports.default = new CronJobController();
