"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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

class CronJobController {
    async deleteExpiredNotices(req, res) {
        
        const startOfToday = (0, moment_timezone_1.default)().startOf('day').toDate();
        const expiredNotices = await noticeRepository.find({
            where: {
                expired: (0, typeorm_1.LessThan)(startOfToday)
            }
        });
        if (expiredNotices.length === 0) {
            throw new api_errors_1.NotFoundError("No expired notices found");
        }
        try {
            await noticeRepository.remove(expiredNotices);
            return res.status(200).json({ message: "Expired notices deleted", notices: expiredNotices });
        }
        catch (error) {
            console.log(error);
            throw new Error("Error deleting expired notices");
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
}
exports.default = new CronJobController();
