"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const noticeRepository_1 = require("../../repositories/noticeRepository");
const typeorm_1 = require("typeorm");
const api_errors_1 = require("../../helpers/api-errors");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
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
}
exports.default = new CronJobController();
