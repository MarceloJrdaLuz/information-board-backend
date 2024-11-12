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
        res.send();
    }
}
exports.default = new CronJobController();
