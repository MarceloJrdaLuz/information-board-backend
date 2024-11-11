"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const noticeRepository_1 = require("../../repositories/noticeRepository");
const typeorm_1 = require("typeorm");
const api_errors_1 = require("../../helpers/api-errors");
class CronJobController {
    async deleteExpiredNotices(req, res) {
        const expiredNotices = await noticeRepository_1.noticeRepository.find({
            where: {
                expired: (0, typeorm_1.LessThan)(new Date())
            }
        });
        console.log(expiredNotices);
        if (expiredNotices.length === 0) {
            console.log("No expired notices found");
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
